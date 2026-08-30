import type { TextStyle } from "react-native";

/**
 * Draft — "Taproom" design language.
 *
 * Warm editorial: paper + ink, a single amber accent, a serif display face
 * (Fraunces) over a clean grotesque (Inter). Content screens are light and
 * printed-looking; the live map inverts to a dark "night" palette.
 *
 * Everything is a token. Screens and primitives read from `themes[mode]`,
 * `space`, `radius`, `typeScale`, and `elevation` — never hard-coded hex.
 */

export const palette = {
  paper: "#F6F1E7",
  paperDeep: "#EFE6D5",
  foam: "#FFFDF8",
  ink: "#1B1712",
  inkSoft: "#5B5348",
  inkMuted: "#8A8275",

  amber: "#C2410C",
  amberBright: "#E8703A",
  rust: "#7C2D12",

  night: "#14110D",
  nightSurface: "#211C15",
  nightSurfaceAlt: "#2B241B",
  foamDim: "#C9C0B2",

  success: "#3F7D4E",
  successNight: "#7FB08A",
  warning: "#B45309",
  danger: "#B3261E",
  dangerNight: "#E4796F",
} as const;

export type ThemeMode = "paper" | "night";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  paper: {
    bg: palette.paper,
    surface: palette.foam,
    surfaceAlt: palette.paperDeep,
    border: "rgba(27,23,18,0.14)",
    hairline: "rgba(27,23,18,0.08)",
    textPrimary: palette.ink,
    textSecondary: palette.inkSoft,
    textMuted: palette.inkMuted,
    accent: palette.amber,
    accentText: palette.foam,
    accentSoft: "rgba(194,65,12,0.10)",
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
  },
  night: {
    bg: palette.night,
    surface: palette.nightSurface,
    surfaceAlt: palette.nightSurfaceAlt,
    border: "rgba(255,253,248,0.16)",
    hairline: "rgba(255,253,248,0.09)",
    textPrimary: palette.foam,
    textSecondary: palette.foamDim,
    textMuted: "#8F8779",
    accent: palette.amberBright,
    accentText: palette.night,
    accentSoft: "rgba(232,112,58,0.16)",
    success: palette.successNight,
    warning: "#E0A34A",
    danger: palette.dangerNight,
  },
};

/** 4pt spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  x2: 32,
  x3: 48,
  x4: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  serif: "Fraunces_400Regular",
  serifMedium: "Fraunces_500Medium",
  serifItalic: "Fraunces_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  mono: "SpaceMono",
} as const;

export type TypeVariant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "mono";

/** Named type roles. Weight is carried by the font family, not `fontWeight`. */
export const typeScale: Record<TypeVariant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.sansSemibold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyStrong: { fontFamily: fonts.sansSemibold, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  label: { fontFamily: fonts.sansSemibold, fontSize: 11.5, lineHeight: 14, letterSpacing: 0.8 },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
};

export const elevation = {
  card: {
    shadowColor: "#1B1712",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: "#1B1712",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/** The font map handed to `useFonts` in the root layout. */
export { fonts as fontTokens };
