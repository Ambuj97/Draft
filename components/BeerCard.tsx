import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { getLocales } from "expo-localization";
import Colors from "@/constants/Colors";
import type { Beer } from "@/db/schema";

interface BeerCardProps {
  beer: Beer;
  onPress?: () => void;
}

/**
 * Displays a single beer log entry with name, brewery,
 * ABV, price, rating, and optional photo.
 */
export function BeerCard({ beer, onPress }: BeerCardProps) {
  const currencySymbol = getLocales()[0]?.currencySymbol || "£";

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          {/* Photo */}
          {beer.photoUri ? (
            <Image
              source={{ uri: beer.photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>🍺</Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>
              {beer.name}
            </Text>
            {beer.brewery && (
              <Text style={styles.brewery} numberOfLines={1}>
                {beer.brewery}
              </Text>
            )}

            <View style={styles.metaRow}>
              {beer.abv != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{beer.abv}%</Text>
                </View>
              )}
              {beer.price != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {currencySymbol}{beer.price.toFixed(2)}
                  </Text>
                </View>
              )}
              {beer.rating != null && (
                <Text style={styles.rating}>
                  {"★".repeat(beer.rating)}
                  {"☆".repeat(5 - beer.rating)}
                </Text>
              )}
            </View>

            {beer.venue && (
              <Text style={styles.venue} numberOfLines={1}>
                📍 {beer.venue}
              </Text>
            )}
          </View>
        </View>

        {beer.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {beer.notes}
          </Text>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "rgba(179, 98, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  photoEmoji: {
    fontSize: 28,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  brewery: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(179, 98, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
  rating: {
    fontSize: 12,
    color: Colors.primaryLight,
    letterSpacing: 1,
  },
  venue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
