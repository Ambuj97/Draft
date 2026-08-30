import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { themes, space, fonts } from "@/constants/theme";

const TAB_CONFIG: Record<
  string,
  { icon: React.ComponentProps<typeof FontAwesome>["name"]; label: string }
> = {
  index: { icon: "map-o", label: "Crawl" },
  taproom: { icon: "comments-o", label: "Taproom" },
  cellar: { icon: "archive", label: "Cellar" },
  profile: { icon: "user-o", label: "You" },
};

const BAR_HEIGHT = 58;

/**
 * Flat editorial tab bar pinned to the bottom edge: foam surface, hairline
 * top rule, a short amber marker over the active tab.
 *
 * Two things this layout depends on, both learned the hard way on the New
 * Architecture:
 *   1. Tabs use an explicit pixel width (screen width / count), not `flex: 1` —
 *      the flex shorthand doesn't distribute inside this absolute row.
 *   2. The Pressable `style` is a plain object, NOT the `({ pressed }) => …`
 *      function form, which fails to apply the width.
 */
export function DraftTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const c = themes.paper;

  const routes = state.routes;
  const tabWidth = width / routes.length;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width,
        height: BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        paddingTop: space.sm,
        flexDirection: "row",
        backgroundColor: c.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.border,
        shadowColor: "#1B1712",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {routes.map((route, index) => {
        const isFocused = state.index === index;
        const cfg =
          TAB_CONFIG[route.name] ?? { icon: "circle-o" as const, label: route.name };
        const tint = isFocused ? c.accent : c.textMuted;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            android_ripple={{ color: c.accentSoft, borderless: true }}
            style={{
              width: tabWidth,
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <View
              style={{
                width: 18,
                height: 2,
                borderRadius: 1,
                marginBottom: 6,
                backgroundColor: isFocused ? c.accent : "transparent",
              }}
            />
            <FontAwesome name={cfg.icon} size={19} color={tint} />
            <RNText
              numberOfLines={1}
              style={{
                marginTop: 4,
                fontSize: 10,
                letterSpacing: 0.5,
                textAlign: "center",
                color: tint,
                fontFamily: isFocused ? fonts.sansBold : fonts.sansMedium,
              }}
            >
              {cfg.label.toUpperCase()}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}
