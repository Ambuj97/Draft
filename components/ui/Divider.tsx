import React from "react";
import { View, StyleSheet } from "react-native";
import { space } from "@/constants/theme";
import { useTheme } from "./ThemeContext";

interface Props {
  spacing?: keyof typeof space | number;
  vertical?: boolean;
}

/** Hairline rule in the theme's border color. */
export function Divider({ spacing = "lg", vertical = false }: Props) {
  const { colors } = useTheme();
  const gap = typeof spacing === "number" ? spacing : space[spacing];

  if (vertical) {
    return (
      <View
        style={{
          width: StyleSheet.hairlineWidth,
          alignSelf: "stretch",
          marginHorizontal: gap,
          backgroundColor: colors.border,
        }}
      />
    );
  }

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginVertical: gap,
        backgroundColor: colors.border,
      }}
    />
  );
}
