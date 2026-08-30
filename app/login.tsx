import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/auth";
import { space } from "@/constants/theme";

const HANDLE_RE = /^[a-zA-Z0-9_]{2,20}$/;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const clean = handle.trim().replace(/^@+/, "");
    if (!HANDLE_RE.test(clean)) {
      setError("2–20 letters, numbers, or underscores.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // No navigation here — the auth guard in _layout swaps screens once
      // the account is stored.
      await signIn(clean, email);
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
              label="Pick a handle"
              placeholder="beerlover"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              value={handle}
              onChangeText={(t) => {
                setHandle(t);
                if (error) setError(null);
              }}
              onSubmitEditing={submit}
              returnKeyType="go"
              error={error ?? undefined}
              hint={error ? undefined : "How you'll show up in the Taproom."}
            />
            <Field
              label="Email (optional)"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              hint="Only for account recovery later — skip it for now if you like."
            />
            <Button
              title={isSubmitting ? "Setting up…" : "Enter the Taproom"}
              onPress={submit}
              loading={isSubmitting}
              size="lg"
              fullWidth
              style={{ marginTop: space.sm }}
            />
          </View>

          <Text variant="caption" color="muted" align="center" style={styles.legal}>
            Your handle lives on this device. You must be of legal drinking age
            to use Draft.
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
