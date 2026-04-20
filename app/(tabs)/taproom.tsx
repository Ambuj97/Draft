import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ThreadCard } from "@/components/ThreadCard";
import { PostComposer } from "@/components/PostComposer";
import { useDatabase } from "@/db/provider";
import { threads, Thread } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getLocales } from "expo-localization";
import * as Location from "expo-location";
import Colors from "@/constants/Colors";

type FeedTab = "zone" | "live" | "price" | "global";

const FEED_TABS: { key: FeedTab; label: string; emoji: string }[] = [
  { key: "zone", label: "Zone", emoji: "📍" },
  { key: "live", label: "Live", emoji: "⚡" },
  { key: "price", label: "Prices", emoji: "💰" },
  { key: "global", label: "Global", emoji: "🌍" },
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

/**
 * Taproom Screen — "The Social Layer"
 * Reddit-style feed with zone boards, live sessions, price watch, and global threads.
 */
export default function TaproomScreen() {
  const insets = useSafeAreaInsets();
  const { db, isReady } = useDatabase();

  const [activeTab, setActiveTab] = useState<FeedTab>("zone");
  const [threadList, setThreadList] = useState<Thread[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [localCity, setLocalCity] = useState("Local Zone");
  const [currencySymbol] = useState(() => getLocales()[0]?.currencySymbol || "£");

  // Load threads on focus
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        loadThreads();
      }
    }, [isReady, activeTab])
  );

  const loadThreads = async () => {
    try {
      let result = await db
        .select()
        .from(threads)
        .orderBy(desc(threads.createdAt));

      // Seed with demo data if empty
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

        const seedThreads = getDemoThreads(city, currencySymbol);
        for (const seed of seedThreads) {
          await db.insert(threads).values(seed);
        }
        setSeeded(true);
        result = await db
          .select()
          .from(threads)
          .orderBy(desc(threads.createdAt));
      }

      // Filter by tab
      const filtered = result.filter((t) => {
        switch (activeTab) {
          case "zone":
            return t.zoneId != null && !t.isEphemeral;
          case "live":
            return t.isEphemeral;
          case "price":
            return (
              t.title.toLowerCase().includes("price") ||
              t.title.toLowerCase().includes(currencySymbol) ||
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
      Alert.alert("Error", "Failed to create post.");
    }
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Taproom</Text>
            <Text style={styles.subtitle}>The social layer</Text>
          </View>
          <Button
            title="+ Post"
            onPress={() => setShowComposer(true)}
            variant="secondary"
            size="sm"
          />
        </View>

        {/* Feed tabs */}
        <View style={styles.tabRow}>
          {FEED_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.feedTab,
                activeTab === tab.key && styles.feedTabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.feedTabEmoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.feedTabLabel,
                  activeTab === tab.key && styles.feedTabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Thread feed */}
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {threadList.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyEmoji}>
                {FEED_TABS.find((t) => t.key === activeTab)?.emoji}
              </Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to post in{" "}
                {FEED_TABS.find((t) => t.key === activeTab)?.label}
              </Text>
            </View>
          ) : (
            threadList.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          )}
        </ScrollView>
      </View>

      {/* Post composer */}
      <PostComposer
        visible={showComposer}
        zoneId={activeTab === "zone" ? localCity : undefined}
        onSubmit={handlePost}
        onCancel={() => setShowComposer(false)}
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
    marginBottom: 16,
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
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  feedTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  feedTabActive: {
    backgroundColor: "rgba(179, 98, 0, 0.15)",
    borderColor: Colors.primaryGlow,
  },
  feedTabEmoji: {
    fontSize: 14,
  },
  feedTabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  feedTabLabelActive: {
    color: Colors.primaryLight,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 90,
  },
  emptyFeed: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
