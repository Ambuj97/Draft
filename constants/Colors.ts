/**
 * @deprecated Legacy flat color map. New code should import from
 * `@/constants/theme` and read `useTheme()` colors instead.
 *
 * These keys are repointed onto the "Taproom" paper palette so screens and
 * components that still reference `Colors.*` stay legible until they're
 * migrated to the theme system in their feature branches.
 */
import { palette } from "./theme";

const Colors = {
  // Amber accent
  primary: palette.amber,
  primaryLight: palette.amber,
  primaryDark: palette.rust,
  primaryGlow: "rgba(194, 65, 12, 0.12)",

  // Surfaces (paper)
  background: palette.paper,
  surface: palette.foam,
  surfaceElevated: palette.foam,
  surfaceBorder: "rgba(27, 23, 18, 0.10)",

  // Text (ink)
  text: palette.ink,
  textSecondary: palette.inkSoft,
  textMuted: palette.inkMuted,

  // Legacy "glass" tokens → solid paper equivalents
  glass: palette.foam,
  glassBorder: "rgba(27, 23, 18, 0.14)",
  glassHighlight: "rgba(255, 255, 255, 0.5)",

  // Accents
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,

  // Tab bar
  tabBarBackground: palette.foam,
  tabBarBorder: "rgba(27, 23, 18, 0.12)",
  tabBarActive: palette.amber,
  tabBarInactive: palette.inkMuted,
};

export default Colors;
