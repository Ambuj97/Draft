import React from "react";
import { View, Text, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/constants/Colors";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

/**
 * Reusable empty state with a large icon, title, subtitle,
 * and optional call-to-action button.
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={36} color={Colors.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onCtaPress && (
        <Button
          title={ctaLabel}
          onPress={onCtaPress}
          variant="primary"
          size="md"
          style={styles.cta}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(179, 98, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  cta: {
    minWidth: 200,
  },
});
