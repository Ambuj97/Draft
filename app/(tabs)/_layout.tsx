import React from "react";
import { Tabs } from "expo-router";
import { DraftTabBar } from "@/components/ui/TabBar";

export const unstable_settings = {
  // Land on Home even though `index.tsx` (Crawl) is the group's index route.
  initialRouteName: "home",
};

/**
 * Draft's tabs: Home · Taproom · Crawl · Cellar · You.
 * Each screen owns its own status-bar style via <Screen/>.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DraftTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="taproom" options={{ title: "Taproom" }} />
      <Tabs.Screen name="index" options={{ title: "Crawl" }} />
      <Tabs.Screen name="cellar" options={{ title: "Cellar" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}
