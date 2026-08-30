import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";

import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { RecordButton } from "@/components/ui/RecordButton";
import { ThemeModeProvider } from "@/components/ui/ThemeContext";
import { WebMap, WebMapHandle, WebMapMarker } from "@/components/ui/WebMap";
import {
  RecordSummarySheet,
  CrawlSummary,
} from "@/components/RecordSummarySheet";
import { themes, space, radius, fonts, typeScale, elevation } from "@/constants/theme";
import { useSession } from "@/services/session";
import {
  Coordinate,
  formatDistance,
  formatDuration,
  requestLocationPermission,
  getCurrentPosition,
  getLastKnownPosition,
} from "@/services/location";

const c = themes.night;

type MockVenue = {
  id: string;
  name: string;
  distance: string;
  activeThreads: number;
  latitude: number;
  longitude: number;
};

const VENUE_NAMES = [
  "The Old Anchor",
  "BrewDog Outpost",
  "Craft Beer Co.",
  "The Velvet Tap",
  "Hazy Horizons",
  "The Bitter End",
  "Hop Vault",
];

function generateMockVenues(lat: number, lng: number): MockVenue[] {
  return VENUE_NAMES.map((name, i) => {
    const latOffset = Math.sin(i * 13) * 0.015 - 0.0075;
    const lngOffset = Math.cos(i * 17) * 0.015 - 0.0075;
    return {
      id: `v_${i}`,
      name,
      distance: `${(Math.abs(latOffset) * 1000 + 100).toFixed(0)}m`,
      activeThreads: Math.floor(Math.abs(Math.sin(i)) * 5) + 1,
      latitude: lat + latOffset,
      longitude: lng + lngOffset,
    };
  });
}

/**
 * Crawl — the live map ("The Stumble Path").
 * Map is a Leaflet/OpenStreetMap WebView (works in Expo Go, no API key).
 * The GPS engine rebuild lands in feat/crawl-tracking.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<WebMapHandle>(null);
  const [initialRegion] = useState({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const {
    isTracking,
    isPaused,
    autoPaused,
    sessionName,
    path,
    segments,
    distance,
    elapsedSeconds,
    movingSeconds,
    currentLocation,
    error,
    startSession,
    stopSession,
    discardSession,
    pauseSession,
    resumeSession,
  } = useSession();

  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<CrawlSummary | null>(null);

  const [venues, setVenues] = useState<MockVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<Coordinate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debounced autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || !isSearchFocused) {
      setSearchSuggestions([]);
      return;
    }
    const debounce = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&limit=4`,
          { headers: { "User-Agent": "DraftBeerApp/1.0" } }
        );
        const results = await response.json();
        setSearchSuggestions(results || []);
      } catch (err) {
        console.warn("Autocomplete fetch failed", err);
      }
    }, 600);
    return () => clearTimeout(debounce);
  }, [searchQuery, isSearchFocused]);

  // Follow current location while tracking
  useEffect(() => {
    if (currentLocation) {
      setMyLocation(currentLocation);
      mapRef.current?.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [currentLocation]);

  const handleMapReady = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      console.warn("[Crawl] location permission not granted — map stays at default");
      return;
    }

    // Snap to the cached fix immediately so the map doesn't sit on London.
    const cached = await getLastKnownPosition();
    if (cached) {
      setMyLocation(cached);
      mapRef.current?.animateToRegion(
        { latitude: cached.latitude, longitude: cached.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        0
      );
    }

    // Then refine with a real fix (balanced accuracy resolves fast indoors).
    const fresh = (await getCurrentPosition("balanced")) ?? cached;
    if (!fresh) {
      console.warn("[Crawl] could not resolve a location fix");
      return;
    }
    setMyLocation(fresh);
    mapRef.current?.animateToRegion(
      { latitude: fresh.latitude, longitude: fresh.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
      cached ? 700 : 0
    );
    setVenues(generateMockVenues(fresh.latitude, fresh.longitude));
  };

  // Keep the screen on while a crawl is recording.
  useEffect(() => {
    if (!isTracking) return;
    activateKeepAwakeAsync("crawl").catch(() => {});
    return () => {
      deactivateKeepAwake("crawl").catch(() => {});
    };
  }, [isTracking]);

  const handleStopRequest = () => {
    setSummary({
      distance,
      movingSeconds,
      elapsedSeconds,
      points: path.length,
    });
    pauseSession(); // freeze GPS/battery while the save sheet is open
    setShowSummary(true);
  };

  const handleSave = (name: string) => {
    setShowSummary(false);
    stopSession(name);
  };

  const handleResume = () => {
    setShowSummary(false);
    resumeSession();
  };

  const handleDiscard = () => {
    setShowSummary(false);
    discardSession();
  };

  const executeMapPinpoint = (placeName: string, lat: number, lon: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lon, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      1000
    );
    const searchedVenue: MockVenue = {
      id: "search-target",
      name: placeName,
      latitude: lat,
      longitude: lon,
      distance: "0m",
      activeThreads: Math.floor(Math.random() * 20) + 1,
    };
    setVenues([searchedVenue, ...generateMockVenues(lat, lon)]);
    setSelectedVenue("search-target");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (searchSuggestions.length > 0) {
      handleSuggestionSelect(searchSuggestions[0]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1`,
        { headers: { "User-Agent": "DraftBeerApp/1.0" } }
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const top = results[0];
        executeMapPinpoint(
          top.name || top.display_name.split(",")[0],
          parseFloat(top.lat),
          parseFloat(top.lon)
        );
      } else {
        Alert.alert("Not found", "Couldn't find that location on the map.");
      }
    } catch (err) {
      console.warn("Geocoding exception:", err);
      Alert.alert("Search error", "Couldn't reach the search service. Check your connection.");
    } finally {
      setIsSearching(false);
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    Keyboard.dismiss();
    const rawName = suggestion.name || suggestion.display_name.split(",")[0];
    setSearchQuery(rawName);
    setIsSearchFocused(false);
    setSearchSuggestions([]);
    executeMapPinpoint(rawName, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
  };

  const handleClearSearch = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSearchFocused(false);
  };

  const dismissOverlays = () => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
  };

  const showRadar = !isTracking && venues.length > 0;
  // Before a crawl, the session has no fix yet — fall back to the map's.
  const hasFix = !!currentLocation || !!myLocation;

  const gps = (() => {
    const a = currentLocation?.accuracy ?? myLocation?.accuracy;
    if (a == null) return { color: c.textMuted };
    if (a <= 20) return { color: "#7FB08A" };
    if (a <= 50) return { color: c.accent };
    return { color: "#E4796F" };
  })();

  const status = !isTracking
    ? "GPS"
    : autoPaused
      ? "AUTO-PAUSED"
      : isPaused
        ? "PAUSED"
        : "REC";

  const mapMarkers = useMemo<WebMapMarker[]>(() => {
    const list: WebMapMarker[] = [];
    if (path.length > 0) {
      list.push({
        id: "__start",
        latitude: path[0].latitude,
        longitude: path[0].longitude,
        kind: "start",
      });
    }
    if (!isTracking) {
      for (const v of venues) {
        list.push({
          id: v.id,
          latitude: v.latitude,
          longitude: v.longitude,
          kind: v.id === "search-target" ? "target" : "venue",
          selected: selectedVenue === v.id,
        });
      }
    }
    return list;
  }, [path, isTracking, venues, selectedVenue]);

  return (
    <ThemeModeProvider mode="night">
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <StatusBar style="light" />

        <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
          <WebMap
            ref={mapRef}
            initialRegion={initialRegion}
            segments={segments}
            markers={mapMarkers}
            userLocation={myLocation}
            accent={c.accent}
            onReady={handleMapReady}
            onPress={dismissOverlays}
            onMarkerPress={setSelectedVenue}
          />
        </View>

        {/* Status + GPS chip (top-right) */}
        <View
          style={[
            styles.pulse,
            { top: insets.top + 12, backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={[styles.pulseDot, { backgroundColor: gps.color }]} />
          <Text variant="label" style={{ color: gps.color }}>
            {status}
          </Text>
        </View>

        {/* Header + search */}
        {!isTracking && (
          <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="box-none">
            <Text variant="title" style={{ color: c.textPrimary }}>
              Crawl
            </Text>
            <Text variant="caption" color="muted" style={{ marginBottom: space.md }}>
              The Stumble Path
            </Text>

            <View style={{ position: "relative", zIndex: 200 }}>
              <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
                <FontAwesome name="search" size={14} color={c.textMuted} />
                <TextInput
                  style={[typeScale.body, styles.searchInput, { color: c.textPrimary, fontFamily: fonts.sans }]}
                  placeholder="Search a city, area, or pub…"
                  placeholderTextColor={c.textMuted}
                  selectionColor={c.accent}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                  <Pressable onPress={handleClearSearch} hitSlop={8}>
                    <FontAwesome name="times-circle" size={16} color={c.textMuted} />
                  </Pressable>
                ) : isSearching ? (
                  <FontAwesome name="spinner" size={14} color={c.textMuted} />
                ) : null}
              </View>

              {isSearchFocused && searchSuggestions.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ScrollView style={{ maxHeight: 210 }} keyboardShouldPersistTaps="handled">
                    {searchSuggestions.map((s, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => handleSuggestionSelect(s)}
                        style={[styles.suggestionItem, { borderBottomColor: c.hairline }]}
                      >
                        <FontAwesome name="map-marker" size={13} color={c.textMuted} />
                        <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                          {s.display_name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bottom: radar + controls */}
        <View style={[styles.bottom, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
          {showRadar && (
            <View style={{ marginBottom: space.md }}>
              <Text
                variant="label"
                color="muted"
                style={{ marginLeft: space.xl, marginBottom: space.sm }}
              >
                NEARBY RADAR
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.md }}
              >
                {venues.map((v) => (
                  <Card
                    key={v.id}
                    accent={selectedVenue === v.id}
                    style={styles.radarCard}
                    onPress={() => {
                      setSelectedVenue(v.id);
                      mapRef.current?.animateToRegion(
                        {
                          latitude: v.latitude,
                          longitude: v.longitude,
                          latitudeDelta: 0.006,
                          longitudeDelta: 0.006,
                        },
                        600
                      );
                    }}
                  >
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                      {v.distance}
                    </Text>
                    <Tag
                      label={`${v.activeThreads} here now`}
                      tone="accent"
                      style={{ marginTop: space.sm }}
                    />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          {isTracking && (
            <View style={styles.statsStrip}>
              <Card style={{ paddingVertical: space.md }}>
                <View style={styles.statsRow}>
                  {[
                    { v: formatDuration(movingSeconds), l: "MOVING" },
                    { v: formatDistance(distance), l: "DISTANCE" },
                    { v: formatDuration(elapsedSeconds), l: "TOTAL" },
                  ].map((s, i) => (
                    <React.Fragment key={s.l}>
                      {i > 0 && (
                        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                      )}
                      <View style={styles.statCell}>
                        <Text
                          style={{
                            fontFamily: fonts.displayBold,
                            fontSize: i === 0 ? 24 : 18,
                            color: i === 0 ? c.accent : c.textPrimary,
                          }}
                        >
                          {s.v}
                        </Text>
                        <Text variant="label" color="muted">
                          {s.l}
                        </Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {isTracking && isPaused && (
            <View style={styles.pausedNote}>
              <Text variant="caption" color="muted" align="center">
                {autoPaused
                  ? "Auto-paused — start walking to pick back up"
                  : "Paused"}
              </Text>
            </View>
          )}

          <View style={styles.controls}>
            {!isTracking ? (
              <View style={{ alignItems: "center", gap: space.sm }}>
                <RecordButton
                  kind="start"
                  onPress={() => startSession()}
                  disabled={!hasFix}
                />
                <Text variant="label" color={hasFix ? "accent" : "muted"}>
                  {hasFix ? "START" : "FINDING GPS…"}
                </Text>
              </View>
            ) : (
              <View style={styles.cluster}>
                <RecordButton
                  kind={isPaused ? "resume" : "pause"}
                  size={56}
                  onPress={isPaused ? resumeSession : pauseSession}
                />
                <RecordButton kind="stop" size={64} onPress={handleStopRequest} />
              </View>
            )}
          </View>
        </View>

        {error && (
          <View style={[styles.errorToast, { bottom: insets.bottom + 88 }]}>
            <Text variant="caption" style={{ color: c.danger, textAlign: "center" }}>
              {error}
            </Text>
          </View>
        )}

        <RecordSummarySheet
          visible={showSummary}
          summary={summary}
          defaultName={sessionName}
          onSave={handleSave}
          onResume={handleResume}
          onDiscard={handleDiscard}
        />
      </View>
    </ThemeModeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    zIndex: 100,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 46,
    ...elevation.card,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  suggestions: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    overflow: "hidden",
    ...elevation.raised,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
  },
  controls: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  cluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  statsStrip: {
    marginHorizontal: space.md,
    marginBottom: space.md,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statCell: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34 },
  pausedNote: {
    alignSelf: "center",
    marginBottom: space.sm,
  },
  pulse: {
    position: "absolute",
    right: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#E4796F" },
  radarCard: { width: 210 },
  errorToast: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    backgroundColor: "rgba(228,121,111,0.16)",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(228,121,111,0.4)",
    padding: space.md,
    zIndex: 20,
  },
});
