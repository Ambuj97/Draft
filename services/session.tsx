import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import * as Location from "expo-location";
import {
  Coordinate,
  requestLocationPermission,
  getCurrentPosition,
  watchPosition,
  totalPathDistance,
} from "@/services/location";
import { useDatabase } from "@/db/provider";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SessionState {
  isTracking: boolean;
  isPaused: boolean;
  sessionId: number | null;
  sessionName: string;
  path: Coordinate[];
  distance: number;
  elapsedSeconds: number;
  currentLocation: Coordinate | null;
  error: string | null;
}

interface SessionContextType extends SessionState {
  startSession: (name?: string) => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
}

const initialState: SessionState = {
  isTracking: false,
  isPaused: false,
  sessionId: null,
  sessionName: "",
  path: [],
  distance: 0,
  elapsedSeconds: 0,
  currentLocation: null,
  error: null,
};

const SessionContext = createContext<SessionContextType>({
  ...initialState,
  startSession: async () => {},
  stopSession: async () => {},
  pauseSession: () => {},
  resumeSession: () => {},
});

/**
 * Manages GPS pub crawl sessions — start/stop tracking,
 * path recording, distance calculation, and SQLite persistence.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const [state, setState] = useState<SessionState>(initialState);

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<Coordinate[]>([]);

  // Timer tick
  useEffect(() => {
    if (state.isTracking && !state.isPaused) {
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isTracking, state.isPaused]);

  const startSession = useCallback(
    async (name?: string) => {
      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setState((prev) => ({
            ...prev,
            error: "Location permission denied",
          }));
          return;
        }

        const now = new Date().toISOString();
        const sessionName =
          name || `Session ${new Date().toLocaleDateString()}`;

        // Create session in DB
        let newSessionId: number | null = null;
        if (isReady) {
          const result = await db
            .insert(sessions)
            .values({
              name: sessionName,
              startedAt: now,
              pathJson: "[]",
              isLive: true,
              createdAt: now,
            })
            .returning({ id: sessions.id });
          newSessionId = result[0]?.id ?? null;
        }

        // Get initial position
        const initialPos = await getCurrentPosition();

        pathRef.current = initialPos ? [initialPos] : [];

        setState({
          isTracking: true,
          isPaused: false,
          sessionId: newSessionId,
          sessionName,
          path: pathRef.current,
          distance: 0,
          elapsedSeconds: 0,
          currentLocation: initialPos,
          error: null,
        });

        // Start watching
        const sub = await watchPosition((coord) => {
          pathRef.current.push(coord);
          const dist = totalPathDistance(pathRef.current);
          setState((prev) => ({
            ...prev,
            path: [...pathRef.current],
            distance: dist,
            currentLocation: coord,
          }));
        });
        locationSub.current = sub;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: `Failed to start session: ${err}`,
        }));
      }
    },
    [db, isReady]
  );

  const stopSession = useCallback(async () => {
    // Stop watching
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Save to DB
    if (state.sessionId && isReady) {
      const now = new Date().toISOString();
      try {
        await db
          .update(sessions)
          .set({
            endedAt: now,
            pathJson: JSON.stringify(pathRef.current),
            distance: state.distance,
            isLive: false,
          })
          .where(eq(sessions.id, state.sessionId));
      } catch (err) {
        console.error("Failed to save session:", err);
      }
    }

    pathRef.current = [];
    setState(initialState);
  }, [db, isReady, state.sessionId, state.distance]);

  const pauseSession = useCallback(() => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeSession = useCallback(async () => {
    const sub = await watchPosition((coord) => {
      pathRef.current.push(coord);
      const dist = totalPathDistance(pathRef.current);
      setState((prev) => ({
        ...prev,
        path: [...pathRef.current],
        distance: dist,
        currentLocation: coord,
      }));
    });
    locationSub.current = sub;
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
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
