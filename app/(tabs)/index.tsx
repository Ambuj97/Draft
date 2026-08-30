import React, { useEffect, useRef, useState } from "react";
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
import Constants from "expo-constants";
import { FontAwesome } from "@expo/vector-icons";

// react-native-maps has no native module in Expo Go — only load it in a
// dev/standalone build, and show a placeholder otherwise.
const MAPS_AVAILABLE = Constants.executionEnvironment !== "storeClient";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RNMaps = MAPS_AVAILABLE ? require("react-native-maps") : null;
const MapView: any = RNMaps?.default;
const Polyline: any = RNMaps?.Polyline;
const Marker: any = RNMaps?.Marker;

// Use the platform-default map provider (Apple Maps on iOS) so a dev build
// works with no Google Maps API key. Switching to Google + a restricted key
// is handled in feat/crawl-tracking.
const MAP_PROVIDER: any = undefined;

import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ThemeModeProvider } from "@/components/ui/ThemeContext";
import { themes, space, radius, fonts, typeScale, elevation } from "@/constants/theme";
import { useSession } from "@/services/session";
import {
  formatDistance,
  formatDuration,
  requestLocationPermission,
  getCurrentPosition,
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
 * Restyled to the night palette; the GPS engine rebuild lands in feat/crawl-tracking.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const [initialRegion] = useState({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const {
    isTracking,
    isPaused,
    path,
    distance,
    elapsedSeconds,
    currentLocation,
    error,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
  } = useSession();

  const [venues, setVenues] = useState<MockVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
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
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
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

  const handleStartStop = async () => {
    if (isTracking) {
      Alert.alert(
        "End this crawl?",
        `${formatDistance(distance)} on foot over ${formatDuration(elapsedSeconds)}.`,
        [
          { text: "Keep going", style: "cancel" },
          { text: "End & save", style: "destructive", onPress: () => stopSession() },
        ]
      );
    } else {
      await startSession();
    }
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

  const showRadar = !isTracking && venues.length > 0;

  if (!MAPS_AVAILABLE) {
    return (
      <ThemeModeProvider mode="night">
        <View style={[styles.container, styles.placeholder, { backgroundColor: c.bg }]}>
          <StatusBar style="light" />
          <FontAwesome name="map-o" size={44} color={c.accent} style={{ marginBottom: space.lg }} />
          <Text variant="title" style={{ color: c.textPrimary }}>
            Crawl
          </Text>
          <Text
            variant="body"
            color="secondary"
            align="center"
            style={{ marginTop: space.sm, maxWidth: 300 }}
          >
            The live map needs a development build — it can't run inside Expo Go.
            Every other tab works here.
          </Text>
          <Text variant="caption" color="muted" align="center" style={{ marginTop: space.lg }}>
            Coming in the EAS dev-build branch.
          </Text>
        </View>
      </ThemeModeProvider>
    );
  }

  return (
    <ThemeModeProvider mode="night">
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <StatusBar style="light" />

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={MAP_PROVIDER}
          userInterfaceStyle="dark"
          showsUserLocation
          showsMyLocationButton
          customMapStyle={darkMapStyle}
          initialRegion={initialRegion}
          onMapReady={async () => {
            const granted = await requestLocationPermission();
            if (!granted) return;
            const pos = await getCurrentPosition();
            if (pos && mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: pos.latitude,
                  longitude: pos.longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                },
                800
              );
              setVenues(generateMockVenues(pos.latitude, pos.longitude));
            }
          }}
          onPress={() => {
            Keyboard.dismiss();
            setIsSearchFocused(false);
          }}
          onPanDrag={() => {
            Keyboard.dismiss();
            setIsSearchFocused(false);
          }}
        >
          {path.length > 1 && (
            <Polyline
              coordinates={path.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={c.accent}
              strokeWidth={4}
            />
          )}

          {path.length > 0 && (
            <Marker
              coordinate={{ latitude: path[0].latitude, longitude: path[0].longitude }}
              title="Start"
            >
              <View style={[styles.startPin, { borderColor: c.accent, backgroundColor: c.surface }]}>
                <Text style={{ fontSize: 15 }}>🏁</Text>
              </View>
            </Marker>
          )}

          {!isTracking &&
            venues.map((v) => {
              if (v.id === "search-target") {
                return (
                  <Marker
                    key={v.id}
                    coordinate={{ latitude: v.latitude, longitude: v.longitude }}
                    onPress={() => setSelectedVenue(v.id)}
                    title={v.name}
                    anchor={{ x: 0.5, y: 1 }}
                    style={{ zIndex: 999 }}
                  >
                    <FontAwesome name="map-marker" size={40} color={c.accent} />
                  </Marker>
                );
              }
              const selected = selectedVenue === v.id;
              return (
                <Marker
                  key={v.id}
                  coordinate={{ latitude: v.latitude, longitude: v.longitude }}
                  onPress={() => setSelectedVenue(v.id)}
                  style={{ zIndex: selected ? 10 : 1 }}
                >
                  <View
                    style={[
                      styles.venuePin,
                      { backgroundColor: selected ? c.accent : c.surface, borderColor: c.accent },
                    ]}
                  >
                    <FontAwesome name="beer" size={13} color={selected ? c.accentText : c.accent} />
                  </View>
                </Marker>
              );
            })}
        </MapView>

        {/* Live stats */}
        {isTracking && (
          <View style={[styles.liveOverlay, { bottom: insets.bottom + 120 }]} pointerEvents="none">
            <Card style={{ paddingVertical: space.md }}>
              <View style={styles.liveRow}>
                {[
                  { v: formatDistance(distance), l: "DISTANCE" },
                  { v: formatDuration(elapsedSeconds), l: "TIME" },
                  { v: String(path.length), l: "POINTS" },
                ].map((s, i) => (
                  <React.Fragment key={s.l}>
                    {i > 0 && <View style={[styles.liveDivider, { backgroundColor: c.border }]} />}
                    <View style={styles.liveStat}>
                      <Text style={{ fontFamily: fonts.displayBold, fontSize: 19, color: c.accent }}>
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

        {isTracking && !isPaused && (
          <View
            style={[
              styles.pulse,
              { top: insets.top + 12, backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <View style={styles.pulseDot} />
            <Text variant="label" style={{ color: "#E4796F" }}>
              LIVE
            </Text>
          </View>
        )}

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
                    onPress={() => setSelectedVenue(v.id)}
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

          <View style={styles.controls}>
            {isTracking && (
              <Button
                title={isPaused ? "Resume" : "Pause"}
                onPress={isPaused ? resumeSession : pauseSession}
                variant="secondary"
              />
            )}
            <Button
              title={isTracking ? "End crawl" : "Start a crawl"}
              onPress={handleStartStop}
              size="lg"
              fullWidth
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {error && (
          <View style={[styles.errorToast, { bottom: insets.bottom + 88 }]}>
            <Text variant="caption" style={{ color: c.danger, textAlign: "center" }}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </ThemeModeProvider>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1b1712" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1b1712" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8275" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b241b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#3a3227" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#14110d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1b1712" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e2417" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1b1712" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
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
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  liveOverlay: {
    position: "absolute",
    left: space.md,
    right: space.md,
  },
  liveRow: { flexDirection: "row", alignItems: "center" },
  liveStat: { flex: 1, alignItems: "center", gap: 2 },
  liveDivider: { width: StyleSheet.hairlineWidth, height: 30 },
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
  },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#E4796F" },
  startPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  venuePin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
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
  },
});
