import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/auth";
import Colors from "@/constants/Colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !handle.trim()) {
      Alert.alert("Missing Fields", "Please enter both an email and a handle.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), handle.trim());
      router.replace("/(tabs)"); // Navigate to main app
    } catch (err) {
      Alert.alert("Error", "Failed to sign in. " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>🍺 Draft</Text>
          <Text style={styles.tagline}>Join the local beer community.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Choose a Handle</Text>
              <TextInput
                style={styles.input}
                placeholder="@beerlover"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                value={handle}
                onChangeText={setHandle}
              />
            </View>

            <Button
              title={isSubmitting ? "Signing in..." : "Enter the Taproom"}
              onPress={handleLogin}
              disabled={isSubmitting}
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -1,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 48,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  submitBtn: {
    marginTop: 12,
  },
});
