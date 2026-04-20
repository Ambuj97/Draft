/**
 * Draft Analytics Service
 *
 * Wraps PostHog for event tracking. Currently uses a local stub
 * that logs events to console. Replace with real PostHog when ready.
 *
 * To enable PostHog:
 * 1. npm install posthog-react-native
 * 2. Set POSTHOG_API_KEY below
 * 3. Uncomment the PostHog initialization
 */

const POSTHOG_API_KEY = ""; // Set your key here

type EventProperties = Record<string, string | number | boolean | null>;

/**
 * Track an analytics event.
 */
export function trackEvent(event: string, properties?: EventProperties) {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties || "");
  }

  // TODO: Replace with PostHog
  // posthog.capture(event, properties);
}

/**
 * Pre-defined event names for consistency.
 */
export const Events = {
  // Session events
  SESSION_STARTED: "session_started",
  SESSION_ENDED: "session_ended",
  SESSION_PAUSED: "session_paused",
  SESSION_RESUMED: "session_resumed",

  // Beer events
  BEER_SCANNED: "beer_scanned",
  BEER_SAVED: "beer_saved",
  BEER_PHOTO_TAKEN: "beer_photo_taken",

  // Social events
  THREAD_CREATED: "thread_created",
  THREAD_UPVOTED: "thread_upvoted",
  THREAD_DOWNVOTED: "thread_downvoted",

  // Navigation
  TAB_VIEWED: "tab_viewed",
  MODAL_OPENED: "modal_opened",

  // Paywall
  PAYWALL_SHOWN: "paywall_shown",
  SUBSCRIPTION_STARTED: "subscription_started",
} as const;

/**
 * Identify a user for analytics.
 */
export function identifyUser(userId: string, traits?: EventProperties) {
  if (__DEV__) {
    console.log(`[Analytics] Identify: ${userId}`, traits || "");
  }

  // TODO: posthog.identify(userId, traits);
}
