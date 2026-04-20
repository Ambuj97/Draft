import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import Colors from "@/constants/Colors";

interface GlassCardProps extends ViewProps {
  /** Blur intensity 0-100. Default 40 for frosted look. */
  intensity?: number;
  /** Whether to show the amber glow border. */
  glow?: boolean;
  children: React.ReactNode;
}

/**
 * Frosted glass card component — the core of the Liquid Glass design system.
 * Translucent background with blur, subtle border, and optional amber glow.
 */
export function GlassCard({
  intensity = 40,
  glow = false,
  children,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.outer,
        glow && styles.glowBorder,
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={styles.blur}
      >
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  glowBorder: {
    borderColor: Colors.primaryGlow,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  blur: {
    overflow: "hidden",
    borderRadius: 16,
  },
  inner: {
    padding: 14,
    backgroundColor: Colors.glass,
  },
});
