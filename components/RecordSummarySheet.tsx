import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Stat, StatRow } from "@/components/ui/Stat";
import { useTheme } from "@/components/ui/ThemeContext";
import { space, radius } from "@/constants/theme";
import { formatDistance, formatDuration } from "@/services/location";

export interface CrawlSummary {
  distance: number;
  movingSeconds: number;
  elapsedSeconds: number;
  points: number;
}

interface Props {
  visible: boolean;
  summary: CrawlSummary | null;
  defaultName: string;
  onSave: (name: string) => void;
  onResume: () => void;
  onDiscard: () => void;
}

/** Post-crawl sheet: name it, see the summary, save / resume / discard. */
export function RecordSummarySheet({
  visible,
  summary,
  defaultName,
  onSave,
  onResume,
  onDiscard,
}: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  const confirmDiscard = () => {
    Alert.alert("Discard this crawl?", "The route and time won't be saved.", [
      { text: "Keep", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onDiscard },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onResume}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.scrim} onPress={onResume} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          <View style={[styles.grip, { backgroundColor: colors.border }]} />

          <Text variant="label" color="accent">
            CRAWL COMPLETE
          </Text>
          <Text variant="title" style={{ marginTop: space.xs }}>
            Nice one.
          </Text>

          {summary ? (
            <View
              style={[styles.stats, { borderColor: colors.border }]}
            >
              <StatRow>
                <Stat
                  value={formatDuration(summary.movingSeconds)}
                  label="Moving"
                  align="center"
                />
                <Stat
                  value={formatDistance(summary.distance)}
                  label="Distance"
                  align="center"
                />
                <Stat
                  value={formatDuration(summary.elapsedSeconds)}
                  label="Total"
                  align="center"
                />
              </StatRow>
            </View>
          ) : null}

          <Field
            label="Name this crawl"
            value={name}
            onChangeText={setName}
            placeholder="Friday night"
            containerStyle={{ marginTop: space.lg }}
          />

          <View style={styles.actions}>
            <Button
              title="Save crawl"
              onPress={() => onSave(name)}
              size="lg"
              fullWidth
            />
            <Button
              title="Resume"
              onPress={onResume}
              variant="secondary"
              fullWidth
            />
            <Button
              title="Discard"
              onPress={confirmDiscard}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,17,13,0.45)",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.x2,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: space.lg,
  },
  stats: {
    marginTop: space.lg,
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    gap: space.sm,
    marginTop: space.xl,
  },
});
