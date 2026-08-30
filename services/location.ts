import * as Location from "expo-location";

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number | null;
  speed?: number | null;
  /** Horizontal accuracy in metres, if the OS reported it. */
  accuracy?: number | null;
}

/**
 * Request foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export function toCoordinate(location: Location.LocationObject): Coordinate {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
    altitude: location.coords.altitude,
    speed: location.coords.speed,
    accuracy: location.coords.accuracy,
  };
}

/**
 * Get a fresh position fix. "balanced" is much faster than "high" indoors and
 * is plenty for centering a map; use "high" for path recording.
 */
export async function getCurrentPosition(
  accuracy: "balanced" | "high" = "high"
): Promise<Coordinate | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy:
        accuracy === "high" ? Location.Accuracy.High : Location.Accuracy.Balanced,
    });
    return toCoordinate(location);
  } catch {
    return null;
  }
}

/**
 * Last cached fix from the OS — returns instantly (or null). Good for an
 * immediate first guess while a fresh fix is still resolving.
 */
export async function getLastKnownPosition(): Promise<Coordinate | null> {
  try {
    const location = await Location.getLastKnownPositionAsync();
    return location ? toCoordinate(location) : null;
  } catch {
    return null;
  }
}

/**
 * Watch position for an active crawl. High accuracy is required — Balanced is
 * ~100m, too coarse for a walking route and mostly rejected by the noise
 * filter. Battery is kept in check with a longer interval / distance step than
 * the defaults, and `acceptFix` cleans the rest.
 */
export async function watchPosition(
  onUpdate: (coord: Coordinate) => void
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 4000,
      distanceInterval: 8,
    },
    (location) => onUpdate(toCoordinate(location))
  );
}

export interface FixFilterOptions {
  /** Drop fixes reported worse than this (metres). */
  maxAccuracy?: number;
  /** Drop fixes closer than this to the last accepted point (kills jitter). */
  minDistance?: number;
  /** Drop fixes implying a speed above this (m/s) — GPS teleports. */
  maxSpeed?: number;
  /** First fix of a new segment (after a pause) — skip the vs-previous checks. */
  startingSegment?: boolean;
}

export interface FixDecision {
  accept: boolean;
  reason?: "accuracy" | "jitter" | "speed";
}

/**
 * Decide whether a raw GPS fix should be added to the recorded path.
 * `prev` is the last *accepted* fix in the current segment.
 */
export function acceptFix(
  prev: Coordinate | null,
  next: Coordinate,
  opts: FixFilterOptions = {}
): FixDecision {
  const {
    maxAccuracy = 50,
    minDistance = 6,
    maxSpeed = 12,
    startingSegment = false,
  } = opts;

  if (next.accuracy != null && next.accuracy > maxAccuracy) {
    return { accept: false, reason: "accuracy" };
  }
  if (!prev || startingSegment) {
    return { accept: true };
  }

  const d = haversineDistance(prev, next);
  if (d < minDistance) return { accept: false, reason: "jitter" };

  const dt = (next.timestamp - prev.timestamp) / 1000;
  if (dt > 0 && d / dt > maxSpeed) return { accept: false, reason: "speed" };

  return { accept: true };
}

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance of a path in meters.
 */
export function totalPathDistance(path: Coordinate[]): number {
  let distance = 0;
  for (let i = 1; i < path.length; i++) {
    distance += haversineDistance(path[i - 1], path[i]);
  }
  return distance;
}

/**
 * Format distance for display.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
