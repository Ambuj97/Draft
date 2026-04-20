import * as Location from "expo-location";

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number | null;
  speed?: number | null;
}

/**
 * Request foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * Get the current position as a Coordinate.
 */
export async function getCurrentPosition(): Promise<Coordinate | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
    };
  } catch {
    return null;
  }
}

/**
 * Start watching position changes.
 * Returns a subscription that must be removed when done.
 */
export async function watchPosition(
  onUpdate: (coord: Coordinate) => void,
  intervalMs: number = 3000
): Promise<Location.LocationSubscription> {
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 5, // meters
    },
    (location) => {
      onUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
      });
    }
  );
  return subscription;
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
