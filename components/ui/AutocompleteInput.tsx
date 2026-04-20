import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import Colors from "@/constants/Colors";

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suggestions: string[];
  style?: any;
}

export function AutocompleteInput({
  label,
  value,
  onChangeText,
  placeholder,
  suggestions,
  style,
}: AutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  );

  const showSuggestions = isFocused && value.length > 0 && filtered.length > 0;

  return (
    <View style={[styles.container, style, { zIndex: isFocused ? 100 : 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />
      {showSuggestions && (
        <View style={styles.suggestionsWrapper}>
          <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
            {filtered.slice(0, 4).map((s) => (
              <Pressable
                key={s}
                style={styles.suggestionItem}
                onPress={() => {
                  onChangeText(s);
                  setIsFocused(false);
                }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  suggestionsWrapper: {
    position: "absolute",
    top: 72,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    maxHeight: 160,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  suggestionText: {
    color: Colors.text,
    fontSize: 15,
  },
});
