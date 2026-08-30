import React from "react";
import {
  Pressable,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { radius, space, fonts } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { padV: number; padH: number; font: number; min: number; gap: number }> = {
  sm: { padV: 8, padH: 14, font: 13, min: 38, gap: 6 },
  md: { padV: 13, padH: 20, font: 15, min: 48, gap: 8 },
  lg: { padV: 16, padH: 24, font: 16, min: 56, gap: 10 },
};

/**
 * primary  — solid amber, ink-on-amber label
 * secondary — ink hairline outline, transparent
 * ghost    — text only
 * danger   — solid danger
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.accent
      : variant === "danger"
        ? colors.danger
        : "transparent";

  const borderColor =
    variant === "secondary" ? colors.textPrimary : "transparent";

  const labelColor =
    variant === "primary" || variant === "danger"
      ? colors.accentText
      : variant === "ghost"
        ? colors.textSecondary
        : colors.textPrimary;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderRadius: radius.md,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          minHeight: s.min,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      <View style={[styles.row, { gap: s.gap }]}>
        {loading ? (
          <ActivityIndicator size="small" color={labelColor} />
        ) : icon ? (
          <FontAwesome name={icon} size={s.font + 1} color={labelColor} />
        ) : null}
        <Text
          style={{
            color: labelColor,
            fontFamily: fonts.sansBold,
            fontSize: s.font,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
