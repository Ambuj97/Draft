import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useCurrency } from "@/services/currency";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { Tag } from "@/components/ui/Tag";
import { useTheme } from "@/components/ui/ThemeContext";
import { space, radius } from "@/constants/theme";
import type { Beer } from "@/db/schema";

interface BeerCardProps {
  beer: Beer;
  onPress?: () => void;
}

/** One entry in the Cellar: photo, name, brewery, and metadata tags. */
export function BeerCard({ beer, onPress }: BeerCardProps) {
  const { colors } = useTheme();
  const { symbol: currency } = useCurrency();

  return (
    <Card onPress={onPress} style={{ marginHorizontal: 4 }}>
      <View style={styles.row}>
        {beer.photoUri ? (
          <Image source={{ uri: beer.photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.photo,
              styles.placeholder,
              { backgroundColor: colors.accentSoft, borderColor: colors.border },
            ]}
          >
            <Text variant="title">🍺</Text>
          </View>
        )}

        <View style={styles.details}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {beer.name}
          </Text>
          {beer.brewery ? (
            <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 1 }}>
              {beer.brewery}
            </Text>
          ) : null}

          <View style={styles.tags}>
            {beer.abv != null ? <Tag label={`${beer.abv}%`} /> : null}
            {beer.price != null ? (
              <Tag label={`${currency}${beer.price.toFixed(2)}`} tone="accent" />
            ) : null}
            {beer.rating != null ? (
              <Text variant="caption" color="accent">
                {"★".repeat(beer.rating)}
                {"☆".repeat(5 - beer.rating)}
              </Text>
            ) : null}
          </View>

          {beer.venue ? (
            <Text variant="caption" color="muted" numberOfLines={1} style={{ marginTop: space.xs }}>
              📍 {beer.venue}
            </Text>
          ) : null}
        </View>
      </View>

      {beer.notes ? (
        <Text variant="caption" color="secondary" italic numberOfLines={2} style={{ marginTop: space.md }}>
          {beer.notes}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: space.md,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: space.sm,
  },
});
