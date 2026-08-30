import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { radius, space, fonts, typeScale } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Rendered inside the field on the right (icon, clear button, spinner). */
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Labelled text input in the Taproom style: foam fill, hairline border, amber focus. */
export const Field = forwardRef<TextInput, Props>(function Field(
  { label, hint, error, trailing, containerStyle, style, onFocus, onBlur, multiline, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.accent
      : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" color="muted" style={{ marginBottom: space.sm }}>
          {label.toUpperCase()}
        </Text>
      ) : null}

      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radius.md,
          },
          multiline && { minHeight: 96, alignItems: "flex-start" },
        ]}
      >
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            typeScale.body,
            { color: colors.textPrimary, fontFamily: fonts.sans },
            multiline && { textAlignVertical: "top", height: "100%", paddingTop: 12 },
            style,
          ]}
          {...rest}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>

      {error ? (
        <Text variant="caption" color="danger" style={{ marginTop: space.xs }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted" style={{ marginTop: space.xs }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: space.md,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
  },
  trailing: {
    marginLeft: space.sm,
  },
});
