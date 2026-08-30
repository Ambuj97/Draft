import React from "react";
import { Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { elevation } from "@/constants/theme";
import { useTheme } from "./ThemeContext";

type Kind = "start" | "stop" | "pause" | "resume";

interface Props {
  kind: Kind;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

const ICON: Record<Kind, React.ComponentProps<typeof FontAwesome>["name"]> = {
  start: "play",
  stop: "stop",
  pause: "pause",
  resume: "play",
};

/** Big circular recorder control, Strava-style. */
export function RecordButton({ kind, onPress, disabled = false, size = 72 }: Props) {
  const { colors } = useTheme();
  const bg = disabled
    ? colors.surfaceAlt
    : kind === "stop"
      ? colors.danger
      : colors.accent;
  const fg = disabled ? colors.textMuted : colors.accentText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        elevation.raised,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: colors.surface,
        },
        pressed && !disabled ? { transform: [{ scale: 0.93 }], opacity: 0.9 } : null,
      ]}
    >
      <FontAwesome name={ICON[kind]} size={Math.round(size * 0.34)} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
});
