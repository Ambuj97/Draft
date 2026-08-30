import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useTheme } from "@/components/ui/ThemeContext";
import { space, radius } from "@/constants/theme";

interface PostComposerProps {
  visible: boolean;
  zoneId?: string;
  onSubmit: (title: string, body: string) => void;
  onCancel: () => void;
}

/** Bottom-sheet composer for a new Taproom thread. */
export function PostComposer({ visible, zoneId, onSubmit, onCancel }: PostComposerProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const reset = () => {
    setTitle("");
    setBody("");
  };

  const submit = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), body.trim());
    reset();
  };

  const cancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.scrim} onPress={cancel} />
        <View style={[styles.sheet, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={[styles.grip, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text variant="heading">New post</Text>
            {zoneId ? <Tag label={zoneId} icon="map-marker" tone="accent" /> : null}
          </View>

          <View style={{ gap: space.md }}>
            <Field
              placeholder="What's on your mind?"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
            <Field
              placeholder="Details, a hot take, a pub tip…"
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={1000}
              hint={`${body.length}/1000`}
            />
          </View>

          <View style={styles.actions}>
            <Button title="Cancel" onPress={cancel} variant="ghost" />
            <Button title="Post" onPress={submit} disabled={!title.trim()} fullWidth style={{ flex: 1 }} />
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27,23,18,0.35)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.x3,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: space.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginTop: space.xl,
  },
});
