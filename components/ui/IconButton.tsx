import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { radius, elevation } from "@/constants/theme";
import { useTheme } from "./ThemeContext";

type Variant = "solid" | "surface" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  active?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const DIM: Record<Size, { box: number; icon: number }> = {
  sm: { box: 36, icon: 15 },
  md: { box: 44, icon: 18 },
  lg: { box: 52, icon: 21 },
};

/** Round tap target for map controls, headers, and toolbars. */
export function IconButton({
  icon,
  onPress,
  variant = "surface",
  size = "md",
  active = false,
  accessibilityLabel,
  style,
}: Props) {
  const { colors } = useTheme();
  const d = DIM[size];

  const bg =
    variant === "solid"
      ? colors.accent
      : variant === "surface"
        ? colors.surface
        : "transparent";

  const fg = variant === "solid" ? colors.accentText : active ? colors.accent : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          width: d.box,
          height: d.box,
          borderRadius: radius.pill,
          backgroundColor: bg,
          borderColor: colors.border,
          borderWidth: variant === "ghost" ? 0 : StyleSheet.hairlineWidth,
        },
        variant !== "ghost" && elevation.card,
        pressed ? { opacity: 0.85, transform: [{ scale: 0.94 }] } : null,
        style,
      ]}
    >
      <FontAwesome name={icon} size={d.icon} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
