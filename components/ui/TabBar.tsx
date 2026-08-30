import React from "react";
import { View, Pressable, StyleSheet, Text as RNText } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { themes, space, fonts, elevation } from "@/constants/theme";

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
 * top rule, a short amber marker over the active tab. Always paper-styled.
 */
export function DraftTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = themes.paper;

  return (
    <View
      style={[
        styles.wrapper,
        elevation.raised,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
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
            style={({ pressed }) => [
              styles.tab,
              pressed ? { opacity: 0.55 } : null,
            ]}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: isFocused ? c.accent : "transparent" },
              ]}
            />
            <FontAwesome name={cfg.icon} size={19} color={tint} />
            <RNText
              numberOfLines={1}
              style={[
                styles.label,
                { color: tint, fontFamily: isFocused ? fonts.sansBold : fonts.sansMedium },
              ]}
            >
              {cfg.label.toUpperCase()}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 4,
  },
  marker: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginBottom: 6,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
