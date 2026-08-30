import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { radius, space, fonts } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

type Tone = "neutral" | "accent" | "success" | "danger" | "outline";

interface Props {
  label: string;
  tone?: Tone;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Small pill for metadata: ABV, price, zone, "live", etc. */
export function Tag({ label, tone = "neutral", icon, caps = false, style }: Props) {
  const { colors } = useTheme();

  const bg =
    tone === "accent"
      ? colors.accentSoft
      : tone === "success"
        ? "rgba(63,125,78,0.12)"
        : tone === "danger"
          ? "rgba(179,38,30,0.12)"
          : tone === "outline"
            ? "transparent"
            : colors.surfaceAlt;

  const fg =
    tone === "accent"
      ? colors.accent
      : tone === "success"
        ? colors.success
        : tone === "danger"
          ? colors.danger
          : colors.textSecondary;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg },
        tone === "outline" && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {icon ? <FontAwesome name={icon} size={10} color={fg} /> : null}
      <Text
        style={{
          color: fg,
          fontFamily: fonts.sansSemibold,
          fontSize: 11,
          letterSpacing: caps ? 0.6 : 0.2,
        }}
      >
        {caps ? label.toUpperCase() : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
});
