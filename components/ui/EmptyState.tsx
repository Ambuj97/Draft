import React from "react";
import { View, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { space, radius } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaIcon?: React.ComponentProps<typeof FontAwesome>["name"];
  onCtaPress?: () => void;
}

/** Centered icon medallion, serif title, muted body, single CTA. */
export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  ctaIcon,
  onCtaPress,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.medallion,
          { backgroundColor: colors.accentSoft, borderColor: colors.border },
        ]}
      >
        <FontAwesome name={icon} size={30} color={colors.accent} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text
        variant="body"
        color="secondary"
        align="center"
        style={{ marginTop: space.sm, marginBottom: space.xl }}
      >
        {subtitle}
      </Text>
      {ctaLabel && onCtaPress ? (
        <Button title={ctaLabel} onPress={onCtaPress} icon={ctaIcon} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.x2,
  },
  medallion: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
