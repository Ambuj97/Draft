import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/services/session";
import {
  formatDistance,
  formatDuration,
  requestLocationPermission,
  getCurrentPosition,
} from "@/services/location";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

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
    // Generate pseudorandom small offsets
    const latOffset = (Math.sin(i * 13) * 0.015) - 0.0075;
    const lngOffset = (Math.cos(i * 17) * 0.015) - 0.0075;
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

const { width } = Dimensions.get("window");

/**
 * Map Screen — "The Stumble Path"
 * Live GPS tracking with map, session controls, and stats.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [initialRegion, setInitialRegion] = useState({
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

  // Debounced Auto-complete prediction fetching
  useEffect(() => {
    if (!searchQuery.trim() || !isSearchFocused) {
      setSearchSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
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
    }, 600); // 600ms debounce to respect free layer limits

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchFocused]);

  // Remove the old mount-time useEffect that fired before map was ready
  // and handle it in onMapReady instead.

  // Center map on current location during tracking
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
        "End Session?",
        `You've covered ${formatDistance(distance)} in ${formatDuration(elapsedSeconds)}. Save this session?`,
        [
          { text: "Keep Going", style: "cancel" },
          {
            text: "End & Save",
            style: "destructive",
            onPress: () => stopSession(),
          },
        ]
      );
    } else {
      await startSession();
    }
  };

  const executeMapPinpoint = (placeName: string, lat: number, lon: number) => {
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);

    const searchedVenue: MockVenue = {
      id: 'search-target',
      name: placeName,
      latitude: lat,
      longitude: lon,
      distance: "0m",
      activeThreads: Math.floor(Math.random() * 20) + 1,
    };

    setVenues([searchedVenue, ...generateMockVenues(lat, lon)]);
    setSelectedVenue('search-target');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // If we have suggestions, just pick the top one automatically to prevent double fetching
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
        const topResult = results[0];
        const latitude = parseFloat(topResult.lat);
        const longitude = parseFloat(topResult.lon);
        const rawName = topResult.name || topResult.display_name.split(',')[0];
        executeMapPinpoint(rawName, latitude, longitude);
      } else {
        Alert.alert("Not found", "Couldn't find that location on the map.");
      }
    } catch (err: any) {
      console.warn("Geocoding exception:", err);
      Alert.alert(
        "Search Error", 
        "Failed to connect to the search service. Please check your internet connection."
      );
    } finally {
      setIsSearching(false);
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    Keyboard.dismiss();
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const rawName = suggestion.name || suggestion.display_name.split(',')[0];
    setSearchQuery(rawName);
    setIsSearchFocused(false);
    setSearchSuggestions([]);
    executeMapPinpoint(rawName, lat, lon);
  };

  const handleClearSearch = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSearchFocused(false);
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Map Layer (Back) */}
        <View style={StyleSheet.absoluteFillObject}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={true}
            customMapStyle={darkMapStyle}
            initialRegion={initialRegion}
            onMapReady={async () => {
              const granted = await requestLocationPermission();
              if (granted) {
                const pos = await getCurrentPosition();
                if (pos && mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: pos.latitude,
                    longitude: pos.longitude,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }, 800);
                  setVenues(generateMockVenues(pos.latitude, pos.longitude));
                }
              }
            }}
            onPress={() => {
              // Tap background to clear suggestion flyout state and keyboard
              Keyboard.dismiss();
              setIsSearchFocused(false);
            }}
            onPanDrag={() => {
              Keyboard.dismiss();
              setIsSearchFocused(false);
            }}
          >
            {/* Path polyline */}
            {path.length > 1 && (
              <Polyline
                coordinates={path.map((p) => ({
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
                strokeColor={Colors.primaryLight}
                strokeWidth={4}
                lineDashPattern={[0]}
              />
            )}

            {/* Start marker */}
            {path.length > 0 && (
              <Marker
                coordinate={{
                  latitude: path[0].latitude,
                  longitude: path[0].longitude,
                }}
                title="Start"
              >
                <View style={styles.markerStart}>
                  <Text style={styles.markerText}>🏁</Text>
                </View>
              </Marker>
            )}

            {/* Venues radar pins */}
            {!isTracking && venues.map((v) => {
              if (v.id === 'search-target') {
                return (
                  <Marker
                    key={v.id}
                    coordinate={{ latitude: v.latitude, longitude: v.longitude }}
                    onPress={() => setSelectedVenue(v.id)}
                    title={v.name}
                    style={{ zIndex: 999 }}
                    anchor={{ x: 0.5, y: 1 }} // perfectly points bottom center of box to coord
                  >
                    <View style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 50,
                      height: 50,
                    }}>
                      {/* Pulse glow behind pin */}
                      <View style={{
                         position: 'absolute',
                         bottom: 6, // sit glow near the bottom point
                         width: 24, height: 24, borderRadius: 12,
                         backgroundColor: 'rgba(239, 68, 68, 0.3)',
                      }} />
                      <FontAwesome name="map-marker" size={42} color="#ef4444" />
                    </View>
                  </Marker>
                );
              }
              
              return (
                <Marker
                  key={v.id}
                  coordinate={{ latitude: v.latitude, longitude: v.longitude }}
                  onPress={() => setSelectedVenue(v.id)}
                  style={{ zIndex: selectedVenue === v.id ? 10 : 1 }}
                >
                  <View style={[
                    styles.venueMarker, 
                    selectedVenue === v.id && styles.venueMarkerSelected
                  ]}>
                    <FontAwesome 
                      name="beer" 
                      size={14} 
                      color={selectedVenue === v.id ? "#fff" : Colors.primaryLight} 
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* Map overlay — live stats */}
          {isTracking && (
            <View style={styles.liveOverlay}>
              <GlassCard style={styles.liveCard}>
                <View style={styles.liveStats}>
                  <View style={styles.liveStat}>
                    <Text style={styles.liveValue}>
                      {formatDistance(distance)}
                    </Text>
                    <Text style={styles.liveLabel}>Distance</Text>
                  </View>
                  <View style={styles.liveDivider} />
                  <View style={styles.liveStat}>
                    <Text style={styles.liveValue}>
                      {formatDuration(elapsedSeconds)}
                    </Text>
                    <Text style={styles.liveLabel}>Duration</Text>
                  </View>
                  <View style={styles.liveDivider} />
                  <View style={styles.liveStat}>
                    <Text style={styles.liveValue}>{path.length}</Text>
                    <Text style={styles.liveLabel}>Points</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Pulsing dot indicator */}
          {isTracking && !isPaused && (
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Header & Search Bar (Front) */}
        <View style={[styles.header, { paddingTop: insets.top + 8, zIndex: 100 }]} pointerEvents="box-none">
          <View style={styles.titleRow}>
            <Text style={styles.logo}>🍺 Draft</Text>
            <Text style={styles.tagline}>
              {isTracking ? "Live Session" : "The Stumble Path"}
            </Text>
          </View>
          
          <View style={{ position: 'relative', zIndex: 200 }}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search a city, area, or pub..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              
              {searchQuery.length > 0 ? (
                <Pressable onPress={handleClearSearch} style={{ paddingHorizontal: 4 }}>
                  <FontAwesome name="times-circle" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                </Pressable>
              ) : isSearching ? (
                <FontAwesome name="spinner" size={16} color={Colors.textMuted} style={styles.searchIcon} />
              ) : (
                <FontAwesome name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
              )}
            </View>

            {/* Dropdown Suggestions */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <View style={styles.suggestionsWrapper}>
                <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                  {searchSuggestions.map((s, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(s)}
                    >
                      <FontAwesome name="map-marker" size={14} color={Colors.textMuted} style={{ marginRight: 10 }} />
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {s.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Controls and Radar list */}
        <View style={styles.controlsLayer}>
          {!isTracking && venues.length > 0 && (
            <View style={styles.radarContainer}>
              <Text style={styles.radarTitle}>Nearby Radar</Text>
              <View style={styles.scrollWrapper}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.radarList}
                >
                  {venues.map(v => (
                    <GlassCard 
                      key={v.id} 
                      style={[
                        styles.venueCard,
                        selectedVenue === v.id && styles.venueCardSelected
                      ]}
                    >
                      <Text style={styles.venueName}>{v.name}</Text>
                      <View style={styles.venueMeta}>
                        <Text style={styles.venueDistance}>{v.distance}</Text>
                        <View style={styles.venueDot} />
                        <Text style={styles.venueThreads}>
                          <FontAwesome name="fire" size={10} color="#f59e0b" /> {v.activeThreads} live
                        </Text>
                      </View>
                    </GlassCard>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.controls}>
            {isTracking && (
              <Button
                title={isPaused ? "Resume" : "Pause"}
                onPress={isPaused ? resumeSession : pauseSession}
                variant="secondary"
                size="md"
                style={styles.pauseButton}
              />
            )}
            <Button
              title={isTracking ? "End Session" : "Start a Session"}
              onPress={handleStartStop}
              variant="primary"
              size="lg"
              style={styles.mainButton}
            />
          </View>
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

// Dark map style for the Liquid Glass aesthetic
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1d24" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1d24" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7080" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#252830" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#363a44" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#111318" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1a1d24" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1a2010" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1d24" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
    paddingBottom: 12,
  },
  titleRow: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 19, 24, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  searchIcon: {
    marginLeft: 8,
  },
  suggestionsWrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 19, 24, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerStart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(26, 29, 36, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  markerText: {
    fontSize: 16,
  },
  liveOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  liveCard: {
    borderRadius: 16,
  },
  liveStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  liveStat: {
    alignItems: "center",
    flex: 1,
  },
  liveValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryLight,
  },
  liveLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  liveDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.glassBorder,
  },
  pulseContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 29, 36, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  pulseText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ef4444",
    letterSpacing: 1,
  },
  venueMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(26, 29, 36, 0.9)",
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  venueMarkerSelected: {
    backgroundColor: Colors.primary,
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  controlsLayer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
  },
  radarContainer: {
    marginBottom: 16,
  },
  scrollWrapper: {
    paddingLeft: 16,
  },
  radarTitle: {
    marginLeft: 20,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  radarList: {
    gap: 12,
    paddingRight: 32,
  },
  venueCard: {
    width: 200,
    padding: 12,
  },
  venueCardSelected: {
    borderColor: Colors.primaryLight,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  venueMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  venueDistance: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  venueThreads: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  pauseButton: {
    flex: 0.3,
  },
  mainButton: {
    flex: 1,
    borderRadius: 30,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorContainer: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
});
