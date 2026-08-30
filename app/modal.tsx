import React from "react";
import { View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { space } from "@/constants/theme";

const ENTRIES: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "🗺️",
    title: "The Stumble Path",
    body: "GPS tracking for a night out. Your route, distance, and stops, drawn on a dark map.",
  },
  {
    emoji: "📓",
    title: "The Cellar",
    body: "Photograph a label or receipt and Draft pulls out the beer, brewery, ABV, and price.",
  },
  {
    emoji: "💬",
    title: "The Taproom",
    body: "A local feed for prices, taps, and hot takes — pinned to the neighbourhood you're standing in.",
  },
];

export default function AboutScreen() {
  return (
    <Screen scroll clearsTabBar={false}>
      <Text variant="label" color="accent">
        FIELD NOTES
      </Text>
      <Text variant="title" style={{ marginTop: space.xs }}>
        What Draft is
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: space.sm }}>
        A field journal for beer lovers: part run tracker, part tasting log, part
        neighbourhood bulletin board.
      </Text>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        {ENTRIES.map((e) => (
          <Card key={e.title}>
            <Text variant="heading">
              {e.emoji}  {e.title}
            </Text>
            <Text variant="body" color="secondary" style={{ marginTop: space.sm }}>
              {e.body}
            </Text>
          </Card>
        ))}
      </View>

      <Text
        variant="caption"
        color="muted"
        align="center"
        style={{ marginTop: space.x2 }}
      >
        v1.0.0 · Phase 1
      </Text>
    </Screen>
  );
}
