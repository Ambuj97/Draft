import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import Colors from "@/constants/Colors";

/**
 * Modal screen — shows app info and roadmap.
 */
export default function ModalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16 }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>About Draft</Text>
        <Text style={styles.subtitle}>The "Strava for Beer Lovers"</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>🍺 Vision</Text>
          <Text style={styles.cardText}>
            Draft captures the physical journey of a night out, logs every pour
            via AI vision, and connects you to a hyper-local beer community.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>🗺️ The Stumble Path</Text>
          <Text style={styles.cardText}>
            Strava-style GPS tracking for pub crawls. See your route, distance,
            and stops visualised on a beautiful map.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>🤖 The Beer Brain</Text>
          <Text style={styles.cardText}>
            AI-powered label and receipt scanning. Snap a photo and Draft
            extracts the beer name, brewery, ABV, and price.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>💬 The Taproom</Text>
          <Text style={styles.cardText}>
            Reddit-style social layer with geofenced Zone Boards and live
            Session Threads. Real-time intel on prices, vibes, and taps.
          </Text>
        </GlassCard>

        <Text style={styles.version}>v1.0.0 — Phase 1</Text>
        <StatusBar style="light" />
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  version: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 24,
    opacity: 0.6,
  },
});
