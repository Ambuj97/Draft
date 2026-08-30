import React from "react";
import { View, ScrollView, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { themes, ThemeMode, space } from "@/constants/theme";
import { ThemeModeProvider } from "./ThemeContext";
import { Text } from "./Text";

interface Props {
  children: React.ReactNode;
  /** "paper" (default, light editorial) or "night" (dark, for the live map). */
  variant?: ThemeMode;
  scroll?: boolean;
  /** Horizontal gutters. Default true (24pt). */
  padded?: boolean;
  title?: string;
  subtitle?: string;
  /** Rendered on the right of the header row. */
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom padding to clear the floating tab bar. Default true. */
  clearsTabBar?: boolean;
}

/**
 * Page shell: safe-area padding, themed background, an optional editorial
 * header, and a scroll/no-scroll body. Establishes the palette for its subtree.
 */
export function Screen({
  children,
  variant = "paper",
  scroll = false,
  padded = true,
  title,
  subtitle,
  headerRight,
  contentStyle,
  clearsTabBar = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = themes[variant];
  const gutter = padded ? space.xl : 0;

  const header =
    title || subtitle || headerRight ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: space.md,
          marginBottom: space.xl,
        }}
      >
        <View style={{ flex: 1 }}>
          {title ? <Text variant="title">{title}</Text> : null}
          {subtitle ? (
            <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>
    ) : null;

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <ThemeModeProvider mode={variant}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={variant === "night" ? "light" : "dark"} />
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              {
                paddingTop: insets.top + space.md,
                paddingBottom: insets.bottom + (clearsTabBar ? 112 : space.xl),
                paddingHorizontal: gutter,
              },
              contentStyle,
            ]}
          >
            {body}
          </ScrollView>
        ) : (
          <View
            style={[
              {
                flex: 1,
                paddingTop: insets.top + space.md,
                paddingBottom: clearsTabBar ? insets.bottom + 96 : 0,
                paddingHorizontal: gutter,
              },
              contentStyle,
            ]}
          >
            {body}
          </View>
        )}
      </View>
    </ThemeModeProvider>
  );
}
