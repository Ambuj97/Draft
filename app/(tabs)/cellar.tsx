import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { BeerCard } from "@/components/BeerCard";
import {
  BeerConfirmSheet,
  BeerConfirmData,
} from "@/components/BeerConfirmSheet";
import { useDatabase } from "@/db/provider";
import { beers, Beer } from "@/db/schema";
import { desc } from "drizzle-orm";
import { pickImage, analyzeBeerPhoto, BeerExtraction } from "@/services/vision";
import Colors from "@/constants/Colors";

/**
 * Cellar Screen — "Your Beer Log"
 * Shows all logged beers with stats. Supports scanning via camera or gallery.
 */
export default function CellarScreen() {
  const insets = useSafeAreaInsets();
  const { db, isReady } = useDatabase();

  const [beerList, setBeerList] = useState<Beer[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<BeerExtraction | null>(null);

  // Load beers on focus
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        loadBeers();
      }
    }, [isReady])
  );

  const loadBeers = async () => {
    try {
      const result = await db
        .select()
        .from(beers)
        .orderBy(desc(beers.createdAt));
      setBeerList(result);
    } catch (err) {
      console.error("Failed to load beers:", err);
    }
  };

  const handleScan = (source: "camera" | "gallery") => {
    Alert.alert("Scan a Beer", "How would you like to capture?", [
      { text: "📸 Camera", onPress: () => startScan("camera") },
      { text: "🖼️ Gallery", onPress: () => startScan("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const startScan = async (source: "camera" | "gallery") => {
    const uri = await pickImage(source);
    if (!uri) return;

    setPhotoUri(uri);
    setShowConfirm(true);
    setIsAnalyzing(true);

    const result = await analyzeBeerPhoto(uri);
    setExtraction(result);
    setIsAnalyzing(false);
  };

  const handleConfirm = async (data: BeerConfirmData) => {
    const now = new Date().toISOString();
    try {
      await db.insert(beers).values({
        name: data.name,
        brewery: data.brewery || null,
        abv: data.abv ? parseFloat(data.abv) : null,
        price: data.price ? parseFloat(data.price) : null,
        currency: "GBP",
        venue: data.venue || null,
        photoUri: photoUri,
        rating: data.rating || null,
        notes: data.notes || null,
        loggedAt: now,
        createdAt: now,
      });

      setShowConfirm(false);
      setPhotoUri(null);
      setExtraction(null);
      loadBeers();
    } catch (err) {
      console.error("Failed to save beer:", err);
      Alert.alert("Error", "Failed to save beer. Please try again.");
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPhotoUri(null);
    setExtraction(null);
    setIsAnalyzing(false);
  };

  // Stats
  const totalBeers = beerList.length;
  const totalSpent = beerList.reduce((sum, b) => sum + (b.price || 0), 0);
  const topBrewery =
    beerList.length > 0
      ? (Object.entries(
          beerList.reduce(
            (acc, b) => {
              if (b.brewery) acc[b.brewery] = (acc[b.brewery] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—")
      : "—";

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Cellar</Text>
            <Text style={styles.subtitle}>Your beer collection</Text>
          </View>
          {beerList.length > 0 && (
            <Button
              title="+ Scan"
              onPress={() => handleScan("camera")}
              variant="secondary"
              size="sm"
            />
          )}
        </View>

        {/* Stats overview */}
        <GlassCard style={styles.overviewCard} glow>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{totalBeers}</Text>
              <Text style={styles.overviewLabel}>Beers</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber} numberOfLines={1}>
                {topBrewery}
              </Text>
              <Text style={styles.overviewLabel}>Top Brewery</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>
                £{totalSpent.toFixed(0)}
              </Text>
              <Text style={styles.overviewLabel}>Spent</Text>
            </View>
          </View>
        </GlassCard>

        {/* Beer list or empty state */}
        {beerList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="camera"
              title="No beers logged yet"
              subtitle="Snap a photo of a beer label or receipt and let the Beer Brain extract the details for you."
              ctaLabel="Scan a Beer"
              onCtaPress={() => handleScan("camera")}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {beerList.map((beer) => (
              <BeerCard key={beer.id} beer={beer} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Beer confirm sheet */}
      <BeerConfirmSheet
        visible={showConfirm}
        photoUri={photoUri}
        extraction={extraction}
        isLoading={isAnalyzing}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  overviewCard: {
    marginBottom: 20,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  overviewItem: {
    alignItems: "center",
    flex: 1,
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryLight,
  },
  overviewLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.glassBorder,
  },
  emptyContainer: {
    flex: 1,
    paddingBottom: 90,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 90,
  },
});
