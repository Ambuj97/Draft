import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { Tag } from "@/components/ui/Tag";
import { useTheme } from "@/components/ui/ThemeContext";
import { space } from "@/constants/theme";
import type { Thread } from "@/db/schema";

interface ThreadCardProps {
  thread: Thread;
  onUpvote?: (id: number) => void;
  onDownvote?: (id: number) => void;
  onPress?: () => void;
}

/** A feed post: vote rail on the left, zone/live tags, title, preview, meta. */
export function ThreadCard({ thread, onUpvote, onDownvote, onPress }: ThreadCardProps) {
  const { colors } = useTheme();
  const [up, setUp] = useState(thread.upvotes ?? 0);
  const [down, setDown] = useState(thread.downvotes ?? 0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  const score = up - down;

  const tapUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (vote === "up") {
      setUp((v) => v - 1);
      setVote(null);
    } else {
      if (vote === "down") setDown((v) => v - 1);
      setUp((v) => v + 1);
      setVote("up");
    }
    onUpvote?.(thread.id);
  };

  const tapDown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (vote === "down") {
      setDown((v) => v - 1);
      setVote(null);
    } else {
      if (vote === "up") setUp((v) => v - 1);
      setDown((v) => v + 1);
      setVote("down");
    }
    onDownvote?.(thread.id);
  };

  return (
    <Card onPress={onPress} style={{ marginHorizontal: 4 }}>
      <View style={styles.row}>
        <View style={styles.voteRail}>
          <Pressable onPress={tapUp} hitSlop={8}>
            <FontAwesome
              name="chevron-up"
              size={13}
              color={vote === "up" ? colors.accent : colors.textMuted}
            />
          </Pressable>
          <Text
            variant="bodyStrong"
            style={{ color: score > 0 ? colors.accent : score < 0 ? colors.danger : colors.textSecondary }}
          >
            {score}
          </Text>
          <Pressable onPress={tapDown} hitSlop={8}>
            <FontAwesome
              name="chevron-down"
              size={13}
              color={vote === "down" ? colors.danger : colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          {(thread.zoneId || thread.isEphemeral) && (
            <View style={styles.tags}>
              {thread.zoneId ? <Tag label={thread.zoneId} icon="map-marker" /> : null}
              {thread.isEphemeral ? <Tag label="Live" tone="danger" caps /> : null}
            </View>
          )}

          <Text variant="subheading" numberOfLines={2}>
            {thread.title}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
            {thread.body}
          </Text>

          <View style={styles.meta}>
            <Text variant="caption" color="muted">
              {timeAgo(thread.createdAt)}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
            <FontAwesome name="comment-o" size={11} color={colors.textMuted} />
            <Text variant="caption" color="muted">
              0
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: space.md,
  },
  voteRail: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    width: 28,
    paddingTop: 2,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: space.sm,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
