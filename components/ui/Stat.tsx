import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { space, fonts } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

interface StatProps {
  value: string | number;
  label: string;
  size?: "md" | "lg";
  align?: "flex-start" | "center" | "flex-end";
  style?: StyleProp<ViewStyle>;
}

/** A single figure + label. Numerals set in Fraunces for editorial character. */
export function Stat({ value, label, size = "md", align = "flex-start", style }: StatProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ alignItems: align, gap: 3 }, style]}>
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: fonts.displayBold,
          fontSize: size === "lg" ? 30 : 21,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text variant="label" color="muted">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

interface RowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Evenly spaced stat row with hairline separators. */
export function StatRow({ children, style }: RowProps) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.row, style]}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <View style={{ width: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: colors.border }} />
          ) : null}
          <View style={{ flex: 1, alignItems: "center" }}>{child}</View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
});
