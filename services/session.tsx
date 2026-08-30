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
/** No movement for this long → auto-pause. */
const AUTOPAUSE_AFTER_MS = 60_000;
/** Below this speed a fix doesn't count toward moving time (m/s ≈ 2 km/h). */
const MOVING_SPEED_MPS = 0.6;
/** How far you must walk from the auto-pause spot to auto-resume (metres). */
const MIN_RESUME_METERS = 15;

interface SessionState {
  isTracking: boolean;
  isPaused: boolean;
  /** Paused by the recorder because you stopped moving (vs. you tapping pause). */
  autoPaused: boolean;
  sessionId: number | null;
  sessionName: string;
  /** One array per tracked segment — a pause starts a new one. */
  segments: Coordinate[][];
  pointCount: number;
  distance: number;
  /** Total wall time since start, minus paused time. */
  elapsedSeconds: number;
  /** Time spent actually walking — the headline stat. */
  movingSeconds: number;
  currentLocation: Coordinate | null;
  error: string | null;
}

interface SessionContextType extends SessionState {
  path: Coordinate[];
  startSession: (name?: string) => Promise<void>;
  stopSession: (name?: string) => Promise<void>;
  discardSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => Promise<void>;
}

const initialState: SessionState = {
  isTracking: false,
  isPaused: false,
  autoPaused: false,
  sessionId: null,
  sessionName: "",
  segments: [],
  pointCount: 0,
  distance: 0,
  elapsedSeconds: 0,
  movingSeconds: 0,
  currentLocation: null,
  error: null,
};

const SessionContext = createContext<SessionContextType>({
  ...initialState,
  path: [],
  startSession: async () => {},
  stopSession: async () => {},
  discardSession: async () => {},
  pauseSession: () => {},
  resumeSession: async () => {},
});

/**
 * Records a GPS pub crawl, Strava-style: filtered path, gap-aware distance, a
 * timestamp clock, moving-time with auto-pause / auto-resume, incremental
 * persistence, and startup cleanup of sessions the app was killed during.
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
  const autoPausedRef = useRef(false);
  const autoPausePosRef = useRef<Coordinate | null>(null);

  const timing = useRef<{
    startedAt: number;
    pausedTotalMs: number;
    pauseStartedAt: number | null;
    movingMs: number;
    lastMoveAt: number;
  }>({
    startedAt: 0,
    pausedTotalMs: 0,
    pauseStartedAt: null,
    movingMs: 0,
    lastMoveAt: 0,
  });

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

  const resetEngine = useCallback(() => {
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
    segmentsRef.current = [];
    distanceRef.current = 0;
    lastFixRef.current = null;
    startNewSegRef.current = false;
    sessionIdRef.current = null;
    trackingRef.current = false;
    pausedRef.current = false;
    autoPausedRef.current = false;
    autoPausePosRef.current = null;
    timing.current = {
      startedAt: 0,
      pausedTotalMs: 0,
      pauseStartedAt: null,
      movingMs: 0,
      lastMoveAt: 0,
    };
    setState(initialState);
  }, []);

  const onFix = useCallback(
    (coord: Coordinate) => {
      setState((s) => ({ ...s, currentLocation: coord }));

      // While paused, only an auto-pause keeps the watcher alive — and only to
      // notice that you've started walking again.
      if (pausedRef.current) {
        if (autoPausedRef.current && autoPausePosRef.current) {
          const moved = haversineDistance(autoPausePosRef.current, coord);
          if (moved >= MIN_RESUME_METERS) {
            const t = timing.current;
            if (t.pauseStartedAt != null) {
              t.pausedTotalMs += Date.now() - t.pauseStartedAt;
              t.pauseStartedAt = null;
            }
            t.lastMoveAt = Date.now();
            autoPausedRef.current = false;
            pausedRef.current = false;
            autoPausePosRef.current = null;
            segmentsRef.current.push([coord]);
            startNewSegRef.current = false;
            lastFixRef.current = coord;
            setState((s) => ({ ...s, isPaused: false, autoPaused: false }));
            syncPath();
          }
        }
        return;
      }

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
        if (prev) {
          const d = haversineDistance(prev, coord);
          distanceRef.current += d;
          const dt = (coord.timestamp - prev.timestamp) / 1000;
          if (dt > 0 && d / dt >= MOVING_SPEED_MPS) {
            timing.current.movingMs += Math.min(dt, 10) * 1000;
            timing.current.lastMoveAt = Date.now();
          }
        }
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
          movingMs: timing.current.movingMs,
        })
        .where(eq(sessions.id, id));
    } catch (err) {
      console.warn("[session] persist failed", err);
    }
  }, [db, isReady]);

  // Ticking clock + auto-pause watchdog. Values are derived from timestamps so
  // a throttled JS thread can't make them drift.
  useEffect(() => {
    if (!state.isTracking || state.isPaused) return;

    const update = () => {
      setState((s) => ({
        ...s,
        elapsedSeconds: computeElapsed(),
        movingSeconds: Math.floor(timing.current.movingMs / 1000),
      }));

      if (Date.now() - timing.current.lastMoveAt > AUTOPAUSE_AFTER_MS) {
        timing.current.pauseStartedAt = Date.now();
        autoPausePosRef.current = lastFixRef.current;
        startNewSegRef.current = true;
        pausedRef.current = true;
        autoPausedRef.current = true;
        setState((s) => ({ ...s, isPaused: true, autoPaused: true }));
      }
    };

    update();
    tickRef.current = setInterval(update, 1000);
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

  // Re-foreground catch-up: Expo Go suspends the watcher in the background.
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
        autoPausedRef.current = false;
        autoPausePosRef.current = null;
        timing.current = {
          startedAt: startedAtMs,
          pausedTotalMs: 0,
          pauseStartedAt: null,
          movingMs: 0,
          lastMoveAt: startedAtMs,
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
              movingMs: 0,
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
    const t = timing.current;
    if (t.pauseStartedAt == null) t.pauseStartedAt = Date.now();
    autoPausedRef.current = false;
    autoPausePosRef.current = null;
    startNewSegRef.current = true;
    pausedRef.current = true;
    setState((s) => ({
      ...s,
      isPaused: true,
      autoPaused: false,
      elapsedSeconds: computeElapsed(),
    }));
    persistProgress();
  }, [computeElapsed, persistProgress]);

  const resumeSession = useCallback(async () => {
    const t = timing.current;
    if (t.pauseStartedAt != null) {
      t.pausedTotalMs += Date.now() - t.pauseStartedAt;
      t.pauseStartedAt = null;
    }
    t.lastMoveAt = Date.now();
    autoPausedRef.current = false;
    autoPausePosRef.current = null;
    pausedRef.current = false;
    setState((s) => ({ ...s, isPaused: false, autoPaused: false }));
    if (!watchRef.current) {
      watchRef.current = await watchPosition(onFix);
    }
  }, [onFix]);

  const stopSession = useCallback(
    async (name?: string) => {
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
              name: name?.trim() ? name.trim() : undefined,
              endedAt: new Date().toISOString(),
              pathJson: JSON.stringify(segmentsRef.current),
              distance: distanceRef.current,
              pausedMs: t.pausedTotalMs,
              movingMs: t.movingMs,
              isLive: false,
            })
            .where(eq(sessions.id, id));
        } catch (err) {
          console.error("[session] save failed", err);
        }
      }
      resetEngine();
    },
    [db, isReady, resetEngine]
  );

  const discardSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (id != null && isReady) {
      try {
        await db.delete(sessions).where(eq(sessions.id, id));
      } catch (err) {
        console.error("[session] discard failed", err);
      }
    }
    resetEngine();
  }, [db, isReady, resetEngine]);

  const path = useMemo(() => state.segments.flat(), [state.segments]);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        path,
        startSession,
        stopSession,
        discardSession,
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
