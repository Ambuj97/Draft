import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stat, StatRow } from "@/components/ui/Stat";
import { BeerCard } from "@/components/BeerCard";
import { BeerConfirmSheet, BeerConfirmData } from "@/components/BeerConfirmSheet";
import { useDatabase } from "@/db/provider";
import { beers, Beer } from "@/db/schema";
import { desc } from "drizzle-orm";
import { pickImage, analyzeBeerPhoto, BeerExtraction } from "@/services/vision";
import { space } from "@/constants/theme";
import { getLocales } from "expo-localization";

/**
 * Cellar — the tasting log. Scan a label/receipt, confirm the details,
 * and it lands in your collection.
 */
export default function CellarScreen() {
  const { db, isReady } = useDatabase();
  const currency = getLocales()[0]?.currencySymbol || "£";

  const [beerList, setBeerList] = useState<Beer[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<BeerExtraction | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isReady) loadBeers();
    }, [isReady])
  );

  const loadBeers = async () => {
    try {
      const result = await db.select().from(beers).orderBy(desc(beers.createdAt));
      setBeerList(result);
    } catch (err) {
      console.error("Failed to load beers:", err);
    }
  };

  const handleScan = () => {
    Alert.alert("Add a beer", "Capture a label or receipt.", [
      { text: "Camera", onPress: () => startScan("camera") },
      { text: "Photo Library", onPress: () => startScan("gallery") },
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
        photoUri,
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
      Alert.alert("Error", "Couldn't save that one. Try again.");
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPhotoUri(null);
    setExtraction(null);
    setIsAnalyzing(false);
  };

  const totalSpent = beerList.reduce((sum, b) => sum + (b.price || 0), 0);
  const topBrewery =
    beerList.length > 0
      ? Object.entries(
          beerList.reduce<Record<string, number>>((acc, b) => {
            if (b.brewery) acc[b.brewery] = (acc[b.brewery] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
      : "—";

  return (
    <Screen
      title="Cellar"
      subtitle="Your tasting log"
      headerRight={
        beerList.length > 0 ? (
          <Button title="Add" icon="plus" onPress={handleScan} size="sm" />
        ) : undefined
      }
    >
      <Card accent style={styles.stats}>
        <StatRow>
          <Stat value={beerList.length} label="Beers" align="center" />
          <Stat value={topBrewery} label="Top brewery" align="center" />
          <Stat
            value={`${currency}${totalSpent.toFixed(0)}`}
            label="Spent"
            align="center"
          />
        </StatRow>
      </Card>

      {beerList.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon="camera"
            title="Nothing in the cellar yet"
            subtitle="Snap a label or receipt and Draft fills in the beer, brewery, ABV, and price."
            ctaLabel="Scan a beer"
            ctaIcon="camera"
            onCtaPress={handleScan}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 120, gap: space.sm }}
          showsVerticalScrollIndicator={false}
        >
          {beerList.map((beer) => (
            <BeerCard key={beer.id} beer={beer} />
          ))}
        </ScrollView>
      )}

      <BeerConfirmSheet
        visible={showConfirm}
        photoUri={photoUri}
        extraction={extraction}
        isLoading={isAnalyzing}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    marginBottom: space.lg,
  },
  empty: {
    flex: 1,
    paddingBottom: 80,
  },
  list: {
    flex: 1,
    marginHorizontal: -4,
  },
});
