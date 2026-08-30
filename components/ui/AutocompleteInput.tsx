import React, { useState } from "react";
import { View, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { radius, space, fonts, typeScale } from "@/constants/theme";
import { useTheme } from "./ThemeContext";
import { Text } from "./Text";

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suggestions: string[];
}

/** Text field with an inline suggestion list filtered from a local catalog. */
export function AutocompleteInput({
  label,
  value,
  onChangeText,
  placeholder,
  suggestions,
}: AutocompleteInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(value.toLowerCase()) &&
      s.toLowerCase() !== value.toLowerCase()
  );
  const show = focused && value.length > 0 && filtered.length > 0;

  return (
    <View style={{ zIndex: focused ? 100 : 1 }}>
      <Text variant="label" color="muted" style={{ marginBottom: space.sm }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={[
          typeScale.body,
          styles.input,
          {
            color: colors.textPrimary,
            fontFamily: fonts.sans,
            backgroundColor: colors.surface,
            borderColor: focused ? colors.accent : colors.border,
            borderRadius: radius.md,
          },
        ]}
      />
      {show ? (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 168 }}>
            {filtered.slice(0, 5).map((s, i) => (
              <Pressable
                key={s}
                onPress={() => {
                  onChangeText(s);
                  setFocused(false);
                }}
                style={[
                  styles.item,
                  i < filtered.slice(0, 5).length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.hairline,
                  },
                ]}
              >
                <Text variant="body">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: 13,
  },
  dropdown: {
    position: "absolute",
    top: 72,
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#1B1712",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  item: {
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
});
