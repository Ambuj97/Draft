/**
 * Draft Paywall Configuration
 *
 * Wraps RevenueCat for subscription management.
 * Currently a stub — replace with real RevenueCat when ready.
 *
 * To enable RevenueCat:
 * 1. npx expo install react-native-purchases
 * 2. Set API keys below
 * 3. Configure products in RevenueCat dashboard
 */

const REVENUECAT_API_KEY_IOS = ""; // Your iOS key
const REVENUECAT_API_KEY_ANDROID = ""; // Your Android key

export interface ProFeatures {
  /** Unlimited session history (free: last 5) */
  unlimitedHistory: boolean;
  /** AI-powered beer scanning (free: 3/day) */
  unlimitedScans: boolean;
  /** Export session data as GPX/CSV */
  dataExport: boolean;
  /** Custom session names and tags */
  customTags: boolean;
  /** Ad-free experience */
  adFree: boolean;
  /** Priority posting in Taproom */
  priorityPosts: boolean;
}

const FREE_TIER: ProFeatures = {
  unlimitedHistory: false,
  unlimitedScans: false,
  dataExport: false,
  customTags: false,
  adFree: false,
  priorityPosts: false,
};

const PRO_TIER: ProFeatures = {
  unlimitedHistory: true,
  unlimitedScans: true,
  dataExport: true,
  customTags: true,
  adFree: true,
  priorityPosts: true,
};

/**
 * Check if user has Pro access.
 * TODO: Replace with RevenueCat check.
 */
export async function checkProStatus(): Promise<boolean> {
  // Stub: everyone is free tier for now
  return false;
}

/**
 * Get current feature access level.
 */
export async function getFeatureAccess(): Promise<ProFeatures> {
  const isPro = await checkProStatus();
  return isPro ? PRO_TIER : FREE_TIER;
}

/**
 * Show the paywall.
 * TODO: Replace with RevenueCat paywall.
 */
export async function showPaywall(): Promise<boolean> {
  console.log("[Paywall] Would show paywall here");
  return false;
}

/**
 * Pro tier pricing info.
 */
export const PRICING = {
  monthly: {
    price: "£3.99",
    period: "month",
    trialDays: 7,
  },
  annual: {
    price: "£29.99",
    period: "year",
    savings: "37%",
    trialDays: 7,
  },
} as const;
