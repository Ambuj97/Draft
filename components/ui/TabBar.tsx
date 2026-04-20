import React from "react";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";

const TAB_CONFIG: Record<
  string,
  { icon: React.ComponentProps<typeof FontAwesome>["name"]; label: string }
> = {
  index: { icon: "map-marker", label: "Map" },
  taproom: { icon: "comments", label: "Taproom" },
  cellar: { icon: "glass", label: "Cellar" },
  profile: { icon: "user", label: "Profile" },
};

/**
 * Custom bottom tab bar with Liquid Glass aesthetic.
 * Frosted blur background, amber active indicator with glow,
 * and haptic feedback on tab press.
 */
export function DraftTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] || {
              icon: "circle" as const,
              label: route.name,
            };

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              <TabItem
                key={route.key}
                icon={config.icon}
                label={config.label}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function TabItem({
  icon,
  label,
  isFocused,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {isFocused && <View style={styles.activeGlow} />}
        <FontAwesome
          name={icon}
          size={18}
          color={isFocused ? Colors.tabBarActive : Colors.tabBarInactive}
        />
        <Text
          style={[
            styles.label,
            { color: isFocused ? Colors.tabBarActive : Colors.tabBarInactive },
            isFocused && styles.labelActive,
          ]}
        >
          {label}
        </Text>
        {isFocused && <View style={styles.activeDot} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24, // High float off bottom
    left: 24,
    right: 24,
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 20,
  },
  blurContainer: {
    borderRadius: 999, // Perfect pill shape
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.tabBarBorder,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.tabBarBackground,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 2,
  },
  activeGlow: {
    position: "absolute",
    top: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 130, 10, 0.10)",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  labelActive: {
    fontWeight: "700",
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.tabBarActive,
    marginTop: 3,
  },
});
