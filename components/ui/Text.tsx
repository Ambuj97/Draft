import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { typeScale, TypeVariant, fonts } from "@/constants/theme";
import { useTheme } from "./ThemeContext";

type ColorToken = "primary" | "secondary" | "muted" | "accent" | "inverse";

interface Props extends TextProps {
  variant?: TypeVariant;
  /** Semantic token, or any raw color string (e.g. "#fff"). */
  color?: ColorToken | (string & {});
  align?: "auto" | "left" | "right" | "center" | "justify";
  italic?: boolean;
  /** Shorthand for color="secondary". */
  dim?: boolean;
}

const SERIF_VARIANTS: TypeVariant[] = ["display", "title", "heading"];

/**
 * The single text primitive. Every string in the app should go through this so
 * type scale and font families stay consistent.
 */
export function Text({
  variant = "body",
  color,
  align,
  italic,
  dim,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const resolved =
    dim || color === "secondary"
      ? colors.textSecondary
      : color === "muted"
        ? colors.textMuted
        : color === "accent"
          ? colors.accent
          : color === "inverse"
            ? colors.accentText
            : color === "primary" || color == null
              ? colors.textPrimary
              : color;

  const italicFamily =
    italic && SERIF_VARIANTS.includes(variant) ? fonts.serifItalic : undefined;

  return (
    <RNText
      {...rest}
      style={[
        typeScale[variant],
        { color: resolved },
        italic ? { fontStyle: "italic" as const } : null,
        italicFamily ? { fontFamily: italicFamily } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
