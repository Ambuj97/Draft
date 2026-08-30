import React from "react";
import { View, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { space } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost" }} />
      <Screen clearsTabBar={false}>
        <View style={styles.center}>
          <Text variant="display">404</Text>
          <Text variant="body" color="secondary" align="center" style={{ marginTop: space.sm }}>
            This page wandered off to the bar and didn't come back.
          </Text>
          <Link href="/" style={{ marginTop: space.xl }}>
            <Text variant="bodyStrong" color="accent">
              Back to the map →
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
