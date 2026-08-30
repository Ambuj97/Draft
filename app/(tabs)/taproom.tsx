import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { getLocales } from "expo-localization";
import { desc } from "drizzle-orm";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { ThreadCard } from "@/components/ThreadCard";
import { PostComposer } from "@/components/PostComposer";
import { useDatabase } from "@/db/provider";
import { threads, Thread } from "@/db/schema";
import { useTheme } from "@/components/ui/ThemeContext";
import { space, radius, fonts } from "@/constants/theme";

type FeedTab = "zone" | "live" | "price" | "global";

const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: "zone", label: "Zone" },
  { key: "live", label: "Live" },
  { key: "price", label: "Prices" },
  { key: "global", label: "Global" },
];

function getDemoThreads(city: string, currencySymbol: string): Omit<Thread, "id">[] {
  return [
    {
      zoneId: city,
      sessionId: null,
      title: `Best craft beer spots near ${city}?`,
      body: "Just moved to the area. Looking for places with a good rotating tap list. Any recommendations that aren't tourist traps?",
      authorId: "user_01",
      upvotes: 24,
      downvotes: 2,
      isEphemeral: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      zoneId: city,
      sessionId: null,
      title: `🚨 ${currencySymbol}3.50 pints at The Crown tonight!`,
      body: `Happy hour until 8pm. They've got Neck Oil and Pale Ale on tap. Just walked past and it's not too busy yet.`,
      authorId: "user_02",
      upvotes: 47,
      downvotes: 1,
      isEphemeral: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      zoneId: null,
      sessionId: 1,
      title: "Live crawl: City Centre 🍻",
      body: "Starting at BrewDog. 4 of us. Will be posting updates. Come join if you're nearby!",
      authorId: "user_03",
      upvotes: 15,
      downvotes: 0,
      isEphemeral: true,
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      zoneId: city,
      sessionId: null,
      title: `The ${city} Beer Mile — still worth it in 2026?`,
      body: "Planning to do the full mile this Saturday. Has anyone done it recently? Are all the breweries still open?",
      authorId: "user_04",
      upvotes: 31,
      downvotes: 3,
      isEphemeral: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      zoneId: null,
      sessionId: null,
      title: "Unpopular opinion: IPAs are overrated",
      body: "Fight me. A proper session bitter at 3.8% is infinitely better than another 7% haze bomb. Quality over quantity.",
      authorId: "user_05",
      upvotes: 89,
      downvotes: 42,
      isEphemeral: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      zoneId: city,
      sessionId: null,
      title: "Price check: Beavertown Gamma Ray",
      body: `Tracking pint prices this week:\n• Pub on the Park: ${currencySymbol}6.80\n• The Cock Tavern: ${currencySymbol}6.20\n• Pembury Tavern: ${currencySymbol}5.90`,
      authorId: "user_06",
      upvotes: 56,
      downvotes: 1,
      isEphemeral: false,
      createdAt: new Date(Date.now() - 28800000).toISOString(),
    },
  ];
}

export default function TaproomScreen() {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<FeedTab>("zone");
  const [threadList, setThreadList] = useState<Thread[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [localCity, setLocalCity] = useState("Local Zone");
  const [currencySymbol] = useState(() => getLocales()[0]?.currencySymbol || "£");

  useFocusEffect(
    useCallback(() => {
      if (isReady) loadThreads();
    }, [isReady, activeTab])
  );

  const loadThreads = async () => {
    try {
      let result = await db.select().from(threads).orderBy(desc(threads.createdAt));

      if (result.length === 0 && !seeded) {
        let city = "London";
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            const reverse = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (reverse.length > 0 && reverse[0].city) {
              city = reverse[0].city;
              setLocalCity(city);
            }
          }
        } catch (e) {
          console.warn("Location error", e);
        }

        for (const seed of getDemoThreads(city, currencySymbol)) {
          await db.insert(threads).values(seed);
        }
        setSeeded(true);
        result = await db.select().from(threads).orderBy(desc(threads.createdAt));
      }

      const filtered = result.filter((t) => {
        switch (activeTab) {
          case "zone":
            return t.zoneId != null && !t.isEphemeral;
          case "live":
            return t.isEphemeral;
          case "price":
            return (
              t.title.toLowerCase().includes("price") ||
              t.title.includes(currencySymbol) ||
              t.title.includes("💰")
            );
          case "global":
            return t.zoneId == null && !t.isEphemeral;
          default:
            return true;
        }
      });

      setThreadList(filtered);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  };

  const handlePost = async (title: string, body: string) => {
    const now = new Date().toISOString();
    try {
      await db.insert(threads).values({
        zoneId: activeTab === "zone" ? localCity : null,
        title,
        body,
        authorId: "me",
        upvotes: 1,
        downvotes: 0,
        isEphemeral: activeTab === "live",
        createdAt: now,
      });
      setShowComposer(false);
      loadThreads();
    } catch (err) {
      console.error("Failed to create thread:", err);
      Alert.alert("Error", "Couldn't post that.");
    }
  };

  return (
    <Screen
      title="Taproom"
      subtitle={activeTab === "zone" ? localCity : "The local feed"}
      headerRight={
        <Button title="Post" icon="pencil" size="sm" onPress={() => setShowComposer(true)} />
      }
    >
      <View style={[styles.segment, { borderColor: colors.border }]}>
        {FEED_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.segmentItem,
                active && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={{
                  fontFamily: active ? fonts.sansBold : fonts.sansMedium,
                  fontSize: 12.5,
                  letterSpacing: 0.3,
                  color: active ? colors.accentText : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: space.lg, paddingBottom: 120, gap: space.sm }}
        showsVerticalScrollIndicator={false}
      >
        {threadList.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Text variant="heading" align="center">
              Quiet in here
            </Text>
            <Text variant="body" color="secondary" align="center" style={{ marginTop: space.xs }}>
              Be the first to post in {FEED_TABS.find((t) => t.key === activeTab)?.label}.
            </Text>
          </View>
        ) : (
          threadList.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
        )}
      </ScrollView>

      <PostComposer
        visible={showComposer}
        zoneId={activeTab === "zone" ? localCity : undefined}
        onSubmit={handlePost}
        onCancel={() => setShowComposer(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  emptyFeed: {
    paddingTop: 72,
    alignItems: "center",
  },
});
