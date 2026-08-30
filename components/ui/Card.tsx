import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { radius, space, elevation } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

interface Props extends ViewProps {
  title?: string;
  eyebrow?: string;
  right?: React.ReactNode;
  /** Amber left edge for emphasis. */
  accent?: boolean;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A printed card: solid surface, hairline border, a whisper of shadow.
 * Optional letterpress header (eyebrow + serif title).
 */
export function Card({
  title,
  eyebrow,
  right,
  accent = false,
  padded = true,
  onPress,
  style,
  children,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const hasHeader = !!(title || eyebrow || right);

  const body = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
        elevation.card,
        accent && { borderLeftWidth: 3, borderLeftColor: colors.accent },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {hasHeader && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {eyebrow ? (
              <Text variant="label" color="muted">
                {eyebrow.toUpperCase()}
              </Text>
            ) : null}
            {title ? (
              <Text variant="heading" style={{ marginTop: eyebrow ? 3 : 0 }}>
                {title}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) =>
        pressed ? { opacity: 0.92, transform: [{ scale: 0.995 }] } : null
      }
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: space.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    marginBottom: space.md,
  },
});
