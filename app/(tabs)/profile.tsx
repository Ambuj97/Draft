import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/auth";
import { useDatabase } from "@/db/provider";
import { sessions } from "@/db/schema";
import { desc } from "drizzle-orm";
import Colors from "@/constants/Colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { db, isReady } = useDatabase();
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    if (isReady) {
      const fetchHistory = async () => {
        try {
          const results = await db.select().from(sessions).orderBy(desc(sessions.startedAt));
          setHistory(results);
        } catch (err) {
          console.error("Failed to load history", err);
        }
      };
      
      fetchHistory();
    }
  }, [isReady]);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16 }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
          </View>
        </View>

        <GlassCard style={styles.profileCard} glow>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>😎</Text>
          </View>
          <Text style={styles.handle}>@{user?.handle}</Text>
          <Text style={styles.memberSince}>Member since 2026</Text>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Setup</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Centralized Database</Text>
            <Text style={styles.settingStatus}>Connected</Text>
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingText}>Data Storage</Text>
            <Text style={styles.settingStatus}>Local SQLite</Text>
          </View>
        </GlassCard>

        {/* Previous Crawl History */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Past Crawls</Text>
          <Text style={styles.historyMeta}>{history.length} total</Text>
        </View>

        {history.length === 0 ? (
          <GlassCard style={styles.emptyHistory}>
            <Text style={styles.emptyText}>You haven't tracked any pub crawls yet.</Text>
          </GlassCard>
        ) : (
          history.map((session: any) => (
            <GlassCard key={session.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyTitle}>{session.name}</Text>
                <Text style={styles.historyDate}>
                  {new Date(session.startedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyDistance}>
                  {session.distance < 1000 
                    ? `${Math.round(session.distance)}m` 
                    : `${(session.distance / 1000).toFixed(1)}km`}
                </Text>
              </View>
            </GlassCard>
          ))
        )}

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="secondary"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 100,
  },
  headerRow: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  profileCard: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(179, 98, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  handle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryLight,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  settingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  settingStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryLight,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
    marginTop: 12,
  },
  historyMeta: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 16,
  },
  historyLeft: {},
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyRight: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: Colors.glassBorder,
  },
  historyDistance: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryLight,
  },
  signOutBtn: {
    marginTop: 12,
  },
});
