import React from "react";
import { Tabs } from "expo-router";
import { DraftTabBar } from "@/components/ui/TabBar";

/**
 * Draft's tabs: Crawl (map) · Taproom (social) · Cellar (log) · You.
 * Each screen owns its own status-bar style via <Screen/>.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DraftTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Crawl" }} />
      <Tabs.Screen name="taproom" options={{ title: "Taproom" }} />
      <Tabs.Screen name="cellar" options={{ title: "Cellar" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}
