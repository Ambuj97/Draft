import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/GlassCard";
import Colors from "@/constants/Colors";
import type { Thread } from "@/db/schema";

interface ThreadCardProps {
  thread: Thread;
  onUpvote?: (id: number) => void;
  onDownvote?: (id: number) => void;
  onPress?: () => void;
}

/**
 * Reddit-style thread card with upvote/downvote, title, body,
 * zone badge, and metadata.
 */
export function ThreadCard({
  thread,
  onUpvote,
  onDownvote,
  onPress,
}: ThreadCardProps) {
  const [localUpvotes, setLocalUpvotes] = useState(thread.upvotes ?? 0);
  const [localDownvotes, setLocalDownvotes] = useState(thread.downvotes ?? 0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const score = localUpvotes - localDownvotes;

  const handleUpvote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userVote === "up") {
      setLocalUpvotes((v) => v - 1);
      setUserVote(null);
    } else {
      if (userVote === "down") setLocalDownvotes((v) => v - 1);
      setLocalUpvotes((v) => v + 1);
      setUserVote("up");
    }
    onUpvote?.(thread.id);
  };

  const handleDownvote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userVote === "down") {
      setLocalDownvotes((v) => v - 1);
      setUserVote(null);
    } else {
      if (userVote === "up") setLocalUpvotes((v) => v - 1);
      setLocalDownvotes((v) => v + 1);
      setUserVote("down");
    }
    onDownvote?.(thread.id);
  };

  const timeAgo = getTimeAgo(thread.createdAt);

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          {/* Vote column */}
          <View style={styles.voteColumn}>
            <Pressable onPress={handleUpvote} style={styles.voteButton}>
              <FontAwesome
                name="chevron-up"
                size={14}
                color={userVote === "up" ? Colors.primaryLight : Colors.textMuted}
              />
            </Pressable>
            <Text
              style={[
                styles.score,
                score > 0 && styles.scorePositive,
                score < 0 && styles.scoreNegative,
              ]}
            >
              {score}
            </Text>
            <Pressable onPress={handleDownvote} style={styles.voteButton}>
              <FontAwesome
                name="chevron-down"
                size={14}
                color={
                  userVote === "down" ? Colors.danger : Colors.textMuted
                }
              />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Zone / type badges */}
            <View style={styles.badgeRow}>
              {thread.zoneId && (
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneBadgeText}>📍 {thread.zoneId}</Text>
                </View>
              )}
              {thread.isEphemeral && (
                <View style={styles.ephemeralBadge}>
                  <Text style={styles.ephemeralText}>⚡ Live</Text>
                </View>
              )}
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {thread.title}
            </Text>
            <Text style={styles.body} numberOfLines={3}>
              {thread.body}
            </Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{timeAgo}</Text>
              <View style={styles.metaDot} />
              <FontAwesome
                name="comment-o"
                size={12}
                color={Colors.textMuted}
              />
              <Text style={styles.metaText}>0 replies</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function getTimeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  voteColumn: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
  },
  voteButton: {
    padding: 6,
  },
  score: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  scorePositive: {
    color: Colors.primaryLight,
  },
  scoreNegative: {
    color: Colors.danger,
  },
  content: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  zoneBadge: {
    backgroundColor: "rgba(179, 98, 0, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
  ephemeralBadge: {
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ephemeralText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f87171",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
});
