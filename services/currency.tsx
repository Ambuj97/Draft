import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import * as Location from "expo-location";
import { currencyForCountry, symbolForCurrency } from "@/constants/currencies";

export interface Currency {
  code: string;
  symbol: string;
  /** "locale" until a location fix upgrades it to "location". */
  source: "locale" | "location";
}

const CACHE_KEY = "draft_local_currency";

function localeCurrency(): Currency {
  const l = getLocales()[0];
  const code = l?.currencyCode ?? "GBP";
  return {
    code,
    symbol: l?.currencySymbol ?? symbolForCurrency(code),
    source: "locale",
  };
}

const CurrencyContext = createContext<Currency>(localeCurrency());

/**
 * Provides the currency for *where the user physically is*, falling back to the
 * device locale. Never prompts for location — it only uses a fix when location
 * permission has already been granted elsewhere (Crawl / Taproom).
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(localeCurrency);
  const resolving = useRef(false);

  const resolveFromLocation = useCallback(async () => {
    if (resolving.current) return;
    resolving.current = true;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        }));
      if (!pos) return;

      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const match = currencyForCountry(place?.isoCountryCode);
      if (!match) return;

      setCurrency((prev) =>
        prev.code === match.code && prev.source === "location"
          ? prev
          : { ...match, source: "location" }
      );
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(match));
    } catch (err) {
      console.warn("[currency] location resolve failed", err);
    } finally {
      resolving.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 1. Warm from cache so it's instant + offline-safe.
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const cached = JSON.parse(raw) as { code: string; symbol: string };
        if (cached?.code) {
          setCurrency({ ...cached, source: "location" });
        }
      })
      .catch(() => {});

    // 2. Try to refresh from an actual fix.
    resolveFromLocation();

    // 3. Re-check when the app comes back to the foreground (permission may
    //    have been granted on the Crawl tab in the meantime).
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") resolveFromLocation();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [resolveFromLocation]);

  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): Currency {
  return useContext(CurrencyContext);
}
