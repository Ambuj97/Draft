import React from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DraftTabBar } from "@/components/ui/TabBar";
import Colors from "@/constants/Colors";

/**
 * Draft's three-tab layout: Map → Taproom → Cellar
 * Uses a custom Liquid Glass tab bar.
 */
export default function TabLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <DraftTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Map" }}
        />
        <Tabs.Screen
          name="taproom"
          options={{ title: "Taproom" }}
        />
        <Tabs.Screen
          name="cellar"
          options={{ title: "Cellar" }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile" }}
        />
      </Tabs>
    </>
  );
}
