import React, { createContext, useContext } from "react";
import { themes, ThemeMode, ThemeColors } from "@/constants/theme";

interface ThemeValue {
  mode: ThemeMode;
  colors: ThemeColors;
}

const ThemeCtx = createContext<ThemeValue>({ mode: "paper", colors: themes.paper });

/**
 * Sets the active palette for everything below it. `Screen` and
 * `GradientBackground` mount this; primitives read it via `useTheme`.
 */
export function ThemeModeProvider({
  mode,
  children,
}: {
  mode: ThemeMode;
  children: React.ReactNode;
}) {
  return (
    <ThemeCtx.Provider value={{ mode, colors: themes[mode] }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme(): ThemeValue {
  return useContext(ThemeCtx);
}
