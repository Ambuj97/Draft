import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/auth";
import { space } from "@/constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !handle.trim()) {
      Alert.alert("Missing details", "Enter both an email and a handle.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), handle.trim());
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Couldn't sign in", String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen clearsTabBar={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.masthead}>
            <Text variant="label" color="accent">
              EST. 2026
            </Text>
            <Text variant="display" style={{ marginTop: space.sm }}>
              Draft
            </Text>
            <Text
              variant="body"
              color="secondary"
              italic
              style={{ marginTop: space.xs }}
            >
              A field journal for the beer you chase.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Handle"
              placeholder="beerlover"
              autoCapitalize="none"
              autoComplete="username"
              value={handle}
              onChangeText={setHandle}
              hint="How you'll show up in the Taproom."
            />
            <Button
              title={isSubmitting ? "Signing in…" : "Enter the Taproom"}
              onPress={handleLogin}
              loading={isSubmitting}
              size="lg"
              fullWidth
              style={{ marginTop: space.sm }}
            />
          </View>

          <Text variant="caption" color="muted" align="center" style={styles.legal}>
            You must be of legal drinking age to use Draft.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  masthead: {
    marginBottom: space.x2,
  },
  form: {
    gap: space.lg,
  },
  legal: {
    marginTop: space.x2,
  },
});
