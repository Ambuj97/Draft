import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { themes, ThemeMode } from "@/constants/theme";
import { ThemeModeProvider } from "./ThemeContext";

interface Props {
  children: React.ReactNode;
  /** "paper" (default) for content, "night" for the live map. */
  variant?: ThemeMode;
}

/**
 * Full-bleed themed background with a barely-there warm gradient, and it
 * establishes the palette for its subtree. Kept for screens not yet migrated
 * to <Screen/>.
 */
export function GradientBackground({ children, variant = "paper" }: Props) {
  const c = themes[variant];
  const stops: [string, string, string] =
    variant === "night"
      ? [c.bg, "#100D0A", "#0B0906"]
      : [c.bg, "#F1E7D6", c.bg];

  return (
    <ThemeModeProvider mode={variant}>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <LinearGradient
          colors={stops}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </ThemeModeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
