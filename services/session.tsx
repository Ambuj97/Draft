import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import {
  Coordinate,
  acceptFix,
  haversineDistance,
  requestLocationPermission,
  getCurrentPosition,
  watchPosition,
  toCoordinate,
} from "@/services/location";
import { useDatabase } from "@/db/provider";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const PERSIST_INTERVAL_MS = 10_000;

interface SessionState {
  isTracking: boolean;
  isPaused: boolean;
  sessionId: number | null;
  sessionName: string;
  /** One array per tracked segment — a pause starts a new one, so the map
   *  draws a gap instead of a straight line across town. */
  segments: Coordinate[][];
  pointCount: number;
  distance: number;
  elapsedSeconds: number;
  currentLocation: Coordinate | null;
  error: string | null;
}

interface SessionContextType extends SessionState {
  /** All accepted points, flattened — for markers / counts. */
  path: Coordinate[];
  startSession: (name?: string) => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => Promise<void>;
}

const initialState: SessionState = {
  isTracking: false,
  isPaused: false,
  sessionId: null,
  sessionName: "",
  segments: [],
  pointCount: 0,
  distance: 0,
  elapsedSeconds: 0,
  currentLocation: null,
  error: null,
};

const SessionContext = createContext<SessionContextType>({
  ...initialState,
  path: [],
  startSession: async () => {},
  stopSession: async () => {},
  pauseSession: () => {},
  resumeSession: async () => {},
});

/**
 * Records a GPS pub crawl: filtered path, gap-aware distance, a timestamp-based
 * clock (no drift when the JS thread is throttled), incremental persistence,
 * and startup cleanup of sessions the app was killed during.
 *
 * Foreground only — continuous background tracking needs the dev-build task
 * added in feat/background-gps.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const [state, setState] = useState<SessionState>(initialState);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const segmentsRef = useRef<Coordinate[][]>([]);
  const distanceRef = useRef(0);
  const lastFixRef = useRef<Coordinate | null>(null);
  const startNewSegRef = useRef(false);
  const sessionIdRef = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const pausedRef = useRef(false);

  const timing = useRef<{
    startedAt: number;
    pausedTotalMs: number;
    pauseStartedAt: number | null;
  }>({ startedAt: 0, pausedTotalMs: 0, pauseStartedAt: null });

  const computeElapsed = useCallback(() => {
    const t = timing.current;
    if (!t.startedAt) return 0;
    const end = t.pauseStartedAt ?? Date.now();
    return Math.max(0, Math.floor((end - t.startedAt - t.pausedTotalMs) / 1000));
  }, []);

  const syncPath = useCallback(() => {
    const count = segmentsRef.current.reduce((n, s) => n + s.length, 0);
    setState((s) => ({
      ...s,
      segments: segmentsRef.current.map((seg) => seg.slice()),
      pointCount: count,
      distance: distanceRef.current,
    }));
  }, []);

  const onFix = useCallback(
    (coord: Coordinate) => {
      setState((s) => ({ ...s, currentLocation: coord }));

      const prev = lastFixRef.current;
      const starting =
        startNewSegRef.current || segmentsRef.current.length === 0;

      if (!acceptFix(prev, coord, { startingSegment: starting }).accept) return;

      if (starting) {
        segmentsRef.current.push([coord]);
        startNewSegRef.current = false;
      } else {
        const seg = segmentsRef.current[segmentsRef.current.length - 1];
        seg.push(coord);
        if (prev) distanceRef.current += haversineDistance(prev, coord);
      }
      lastFixRef.current = coord;
      syncPath();
    },
    [syncPath]
  );

  const persistProgress = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id == null || !isReady) return;
    try {
      await db
        .update(sessions)
        .set({
          pathJson: JSON.stringify(segmentsRef.current),
          distance: distanceRef.current,
          pausedMs: timing.current.pausedTotalMs,
        })
        .where(eq(sessions.id, id));
    } catch (err) {
      console.warn("[session] persist failed", err);
    }
  }, [db, isReady]);

  // Ticking clock — value is derived from timestamps, the interval only
  // triggers the re-render, so a throttled JS thread can't make it drift.
  useEffect(() => {
    if (!state.isTracking || state.isPaused) return;
    setState((s) => ({ ...s, elapsedSeconds: computeElapsed() }));
    tickRef.current = setInterval(() => {
      setState((s) => ({ ...s, elapsedSeconds: computeElapsed() }));
    }, 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [state.isTracking, state.isPaused, computeElapsed]);

  // Close out any session the app died in the middle of.
  useEffect(() => {
    if (!isReady) return;
    db.update(sessions)
      .set({ isLive: false, endedAt: new Date().toISOString() })
      .where(eq(sessions.isLive, true))
      .catch((err) => console.warn("[session] orphan cleanup failed", err));
  }, [isReady, db]);

  // Re-foreground catch-up: Expo Go suspends the watcher in the background, so
  // grab one fix on return to reconnect the path.
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (next !== "active" || !trackingRef.current || pausedRef.current) return;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        onFix(toCoordinate(loc));
      } catch {
        /* ignore — next watcher fix will catch up */
      }
    });
    return () => sub.remove();
  }, [onFix]);

  // Tear down on unmount (provider is app-lifetime, but be tidy).
  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      if (tickRef.current) clearInterval(tickRef.current);
      if (persistRef.current) clearInterval(persistRef.current);
    };
  }, []);

  const startSession = useCallback(
    async (name?: string) => {
      try {
        const ok = await requestLocationPermission();
        if (!ok) {
          setState((s) => ({
            ...s,
            error: "Location permission is needed to track a crawl.",
          }));
          return;
        }

        const startedAtMs = Date.now();
        const nowIso = new Date(startedAtMs).toISOString();
        const sessionName =
          name || `Crawl · ${new Date(startedAtMs).toLocaleDateString()}`;

        segmentsRef.current = [];
        distanceRef.current = 0;
        lastFixRef.current = null;
        startNewSegRef.current = false;
        timing.current = {
          startedAt: startedAtMs,
          pausedTotalMs: 0,
          pauseStartedAt: null,
        };

        let newId: number | null = null;
        if (isReady) {
          const rows = await db
            .insert(sessions)
            .values({
              name: sessionName,
              startedAt: nowIso,
              pathJson: "[]",
              distance: 0,
              pausedMs: 0,
              isLive: true,
              createdAt: nowIso,
            })
            .returning({ id: sessions.id });
          newId = rows[0]?.id ?? null;
        }
        sessionIdRef.current = newId;
        trackingRef.current = true;
        pausedRef.current = false;

        const first = await getCurrentPosition("high");
        if (first) {
          segmentsRef.current.push([first]);
          lastFixRef.current = first;
        }

        setState({
          ...initialState,
          isTracking: true,
          sessionId: newId,
          sessionName,
          segments: segmentsRef.current.map((s) => s.slice()),
          pointCount: first ? 1 : 0,
          currentLocation: first ?? null,
        });

        watchRef.current = await watchPosition(onFix);
        persistRef.current = setInterval(persistProgress, PERSIST_INTERVAL_MS);
      } catch (err) {
        setState((s) => ({ ...s, error: `Couldn't start the crawl: ${err}` }));
      }
    },
    [db, isReady, onFix, persistProgress]
  );

  const pauseSession = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    timing.current.pauseStartedAt = Date.now();
    startNewSegRef.current = true;
    pausedRef.current = true;
    setState((s) => ({ ...s, isPaused: true, elapsedSeconds: computeElapsed() }));
    persistProgress();
  }, [computeElapsed, persistProgress]);

  const resumeSession = useCallback(async () => {
    const t = timing.current;
    if (t.pauseStartedAt != null) {
      t.pausedTotalMs += Date.now() - t.pauseStartedAt;
      t.pauseStartedAt = null;
    }
    pausedRef.current = false;
    setState((s) => ({ ...s, isPaused: false }));
    watchRef.current = await watchPosition(onFix);
  }, [onFix]);

  const stopSession = useCallback(async () => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (persistRef.current) {
      clearInterval(persistRef.current);
      persistRef.current = null;
    }

    const t = timing.current;
    if (t.pauseStartedAt != null) {
      t.pausedTotalMs += Date.now() - t.pauseStartedAt;
      t.pauseStartedAt = null;
    }

    const id = sessionIdRef.current;
    if (id != null && isReady) {
      try {
        await db
          .update(sessions)
          .set({
            endedAt: new Date().toISOString(),
            pathJson: JSON.stringify(segmentsRef.current),
            distance: distanceRef.current,
            pausedMs: t.pausedTotalMs,
            isLive: false,
          })
          .where(eq(sessions.id, id));
      } catch (err) {
        console.error("[session] save failed", err);
      }
    }

    segmentsRef.current = [];
    distanceRef.current = 0;
    lastFixRef.current = null;
    startNewSegRef.current = false;
    sessionIdRef.current = null;
    trackingRef.current = false;
    pausedRef.current = false;
    timing.current = { startedAt: 0, pausedTotalMs: 0, pauseStartedAt: null };
    setState(initialState);
  }, [db, isReady]);

  const path = useMemo(() => state.segments.flat(), [state.segments]);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        path,
        startSession,
        stopSession,
        pauseSession,
        resumeSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
