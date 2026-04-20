import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Button } from "@/components/ui/Button";
import Colors from "@/constants/Colors";

interface PostComposerProps {
  visible: boolean;
  zoneId?: string;
  onSubmit: (title: string, body: string) => void;
  onCancel: () => void;
}

/**
 * Modal composer for creating new threads in the Taproom.
 */
export function PostComposer({
  visible,
  zoneId,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), body.trim());
    setTitle("");
    setBody("");
  };

  const handleCancel = () => {
    setTitle("");
    setBody("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.content}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.title}>New Post</Text>
              {zoneId && (
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneText}>📍 {zoneId}</Text>
                </View>
              )}
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.textMuted}
              style={styles.titleInput}
              maxLength={120}
            />

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share more details, a hot take, or a pub recommendation..."
              placeholderTextColor={Colors.textMuted}
              style={styles.bodyInput}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>
              {body.length}/1000
            </Text>

            <View style={styles.actions}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="ghost"
                size="md"
                style={{ flex: 0.4 }}
              />
              <Button
                title="Post"
                onPress={handleSubmit}
                variant="primary"
                size="md"
                disabled={!title.trim()}
                style={{ flex: 0.6 }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    backgroundColor: "rgba(17, 19, 24, 0.95)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  zoneBadge: {
    backgroundColor: "rgba(179, 98, 0, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
  titleInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 12,
  },
  bodyInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    minHeight: 140,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});
