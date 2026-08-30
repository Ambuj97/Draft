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

/**
 * Flat editorial tab bar: foam surface, hairline top rule, a short amber
 * marker over the active tab. Always paper-styled for chrome consistency.
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
          paddingBottom: Math.max(insets.bottom, space.sm),
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const cfg = TAB_CONFIG[route.name] ?? { icon: "circle-o" as const, label: route.name };

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
                pressed ? { opacity: 0.6, transform: [{ scale: 0.94 }] } : null,
              ]}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: isFocused ? c.accent : "transparent" },
                ]}
              />
              <FontAwesome
                name={cfg.icon}
                size={19}
                color={isFocused ? c.accent : c.textMuted}
              />
              <RNLabel focused={isFocused} color={isFocused ? c.accent : c.textMuted}>
                {cfg.label}
              </RNLabel>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RNLabel({
  children,
  focused,
  color,
}: {
  children: string;
  focused: boolean;
  color: string;
}) {
  return (
    <RNText
      numberOfLines={1}
      style={{
        marginTop: 4,
        fontFamily: focused ? fonts.sansBold : fonts.sansMedium,
        fontSize: 10,
        letterSpacing: 0.5,
        color,
      }}
    >
      {children.toUpperCase()}
    </RNText>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignSelf: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  marker: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginBottom: 6,
  },
});
