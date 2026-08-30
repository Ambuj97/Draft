import React from "react";
import { View, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/components/ui/ThemeContext";
import { space, radius } from "@/constants/theme";

export default function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <Screen clearsTabBar={false}>
      <View style={styles.center}>
        <View
          style={[
            styles.medallion,
            { backgroundColor: colors.accentSoft, borderColor: colors.border },
          ]}
        >
          <FontAwesome name="bell-o" size={28} color={colors.accent} />
        </View>
        <Text variant="heading" align="center">
          You&apos;re all caught up
        </Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: space.sm, maxWidth: 300 }}
        >
          Kudos on your crawls, pint-price alerts near you, and invites to live
          crawls will land here.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  medallion: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
