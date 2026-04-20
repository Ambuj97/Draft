import React from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/Colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Draft button with amber gradient (primary), glass outline (secondary),
 * or transparent (ghost). Press triggers haptic feedback.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = SIZE_MAP[size];

  if (variant === "primary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          sizeStyles.button,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
        <View style={styles.buttonTopBorderBevel} />
        <Text style={[styles.textPrimary, sizeStyles.text]}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles.button,
        variant === "secondary" ? styles.secondary : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          variant === "secondary" ? styles.textSecondary : styles.textGhost,
          sizeStyles.text,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const SIZE_MAP: Record<string, { button: ViewStyle; text: TextStyle }> = {
  sm: {
    button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, minHeight: 40 },
    text: { fontSize: 13 },
  },
  md: {
    button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, minHeight: 48 },
    text: { fontSize: 16 },
  },
  lg: {
    button: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 999, minHeight: 56 },
    text: { fontSize: 17 },
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  gradient: {
    borderRadius: 999,
  },
  buttonTopBorderBevel: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  secondary: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.4,
  },
  textPrimary: {
    color: Colors.text,
    fontWeight: "800", // Thicker boldness for UI punch
    letterSpacing: 0.3,
  },
  textSecondary: {
    color: Colors.text, // Better contrast than strict primary light
    fontWeight: "700",
  },
  textGhost: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
