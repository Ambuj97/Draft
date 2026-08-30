import React, { useCallback, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Stat, StatRow } from "@/components/ui/Stat";
import { useAuth } from "@/services/auth";
import { useDatabase } from "@/db/provider";
import { sessions, Session } from "@/db/schema";
import { desc } from "drizzle-orm";
import { space } from "@/constants/theme";
import { formatDistance } from "@/services/location";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { db, isReady } = useDatabase();
  const [history, setHistory] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      db.select()
        .from(sessions)
        .orderBy(desc(sessions.startedAt))
        .then(setHistory)
        .catch((err) => console.error("Failed to load history", err));
    }, [isReady])
  );

  const handleSignOut = () => {
    Alert.alert("Sign out", "You'll need to sign back in to sync.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const totalDistance = history.reduce((sum, s) => sum + (s.distance || 0), 0);
  const finished = history.filter((s) => s.endedAt);

  return (
    <Screen scroll title="You" subtitle={user?.email ?? undefined}>
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <Text variant="title">
            {(user?.handle ?? "D").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="heading" style={{ marginTop: space.md }}>
          @{user?.handle ?? "you"}
        </Text>
        <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
          Member since 2026
        </Text>

        <Divider spacing="lg" />

        <StatRow>
          <Stat value={finished.length} label="Crawls" align="center" />
          <Stat
            value={formatDistance(totalDistance)}
            label="On foot"
            align="center"
          />
          <Stat value={history.length} label="Logged" align="center" />
        </StatRow>
      </Card>

      <Text variant="label" color="muted" style={styles.sectionLabel}>
        PAST CRAWLS
      </Text>

      {history.length === 0 ? (
        <Card>
          <Text variant="body" color="secondary">
            No crawls yet. Start one from the Crawl tab and it'll show up here.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {history.map((s) => (
            <Card key={s.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {s.name}
                </Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {new Date(s.startedAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {s.endedAt ? "" : " · unfinished"}
                </Text>
              </View>
              <Text variant="mono" color="accent">
                {formatDistance(s.distance || 0)}
              </Text>
            </Card>
          ))}
        </View>
      )}

      <Button
        title="Sign out"
        onPress={handleSignOut}
        variant="secondary"
        fullWidth
        style={{ marginTop: space.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: "center",
    paddingVertical: space.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(194,65,12,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(27,23,18,0.14)",
  },
  sectionLabel: {
    marginTop: space.xl,
    marginBottom: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
});
