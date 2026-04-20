import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { getLocales } from "expo-localization";
import { BlurView } from "expo-blur";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { BeerExtraction } from "@/services/vision";
import Colors from "@/constants/Colors";

interface BeerConfirmSheetProps {
  visible: boolean;
  photoUri: string | null;
  extraction: BeerExtraction | null;
  isLoading: boolean;
  onConfirm: (data: BeerConfirmData) => void;
  onCancel: () => void;
}

export interface BeerConfirmData {
  name: string;
  brewery: string;
  abv: string;
  price: string;
  venue: string;
  rating: number;
  notes: string;
}

/**
 * Bottom sheet for confirming/editing AI-extracted beer data
 * before saving to the cellar.
 */
export function BeerConfirmSheet({
  visible,
  photoUri,
  extraction,
  isLoading,
  onConfirm,
  onCancel,
}: BeerConfirmSheetProps) {
  const [name, setName] = useState(extraction?.name || "");
  const [brewery, setBrewery] = useState(extraction?.brewery || "");
  const [abv, setAbv] = useState(extraction?.abv?.toString() || "");
  const [price, setPrice] = useState("");
  const [venue, setVenue] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const currencySymbol = getLocales()[0]?.currencySymbol || "£";

  // Mock Centralized Supabase database catalogs
  const CENTRAL_BEERS = ["Punk IPA", "Neck Oil", "Hazy Jane", "Gamma Ray", "Pale Ale", "Guinness", "Camden Hells", "Dead Pony Club"];
  const CENTRAL_BREWERIES = ["BrewDog", "Beavertown", "Camden Town", "Guinness", "Cloudwater", "Deya", "Verdant"];

  // Sync when extraction changes
  React.useEffect(() => {
    if (extraction) {
      setName(extraction.name || "");
      setBrewery(extraction.brewery || "");
      setAbv(extraction.abv?.toString() || "");
    }
  }, [extraction]);

  const handleConfirm = () => {
    onConfirm({ name, brewery, abv, price, venue, rating, notes });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.content}>
            {/* Handle bar */}
            <View style={styles.handle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>
                {isLoading ? "Analyzing..." : "Confirm Beer"}
              </Text>

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryLight} />
                  <Text style={styles.loadingText}>
                    The Beer Brain is scanning...
                  </Text>
                </View>
              )}

              {!isLoading && (
                <>
                  {/* Photo preview */}
                  {photoUri && (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                      {extraction && (
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>
                            {Math.round(extraction.confidence * 100)}% match
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Editable fields */}
                  <View style={styles.fields}>
                    <View style={{ zIndex: 10 }}>
                      <AutocompleteInput
                        label="Beer Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Punk IPA"
                        suggestions={CENTRAL_BEERS}
                      />
                    </View>
                    <View style={{ zIndex: 9, marginTop: 12 }}>
                      <AutocompleteInput
                        label="Brewery"
                        value={brewery}
                        onChangeText={setBrewery}
                        placeholder="e.g., BrewDog"
                        suggestions={CENTRAL_BREWERIES}
                      />
                    </View>
                    <View style={[styles.row, { marginTop: 12 }]}>
                      <FieldInput
                        label="ABV %"
                        value={abv}
                        onChangeText={setAbv}
                        placeholder="5.4"
                        keyboardType="decimal-pad"
                        style={styles.halfField}
                      />
                      <FieldInput
                        label={`Price (${currencySymbol})`}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="5.80"
                        keyboardType="decimal-pad"
                        style={styles.halfField}
                      />
                    </View>
                    <FieldInput
                      label="Venue"
                      value={venue}
                      onChangeText={setVenue}
                      placeholder="Where are you drinking?"
                    />

                    {/* Rating */}
                    <Text style={styles.fieldLabel}>Rating</Text>
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text
                          key={star}
                          style={[
                            styles.ratingStar,
                            star <= rating && styles.ratingStarActive,
                          ]}
                          onPress={() => setRating(star)}
                        >
                          {star <= rating ? "★" : "☆"}
                        </Text>
                      ))}
                    </View>

                    <FieldInput
                      label="Notes"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Tasting notes, thoughts..."
                      multiline
                    />
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Button
                      title="Cancel"
                      onPress={onCancel}
                      variant="ghost"
                      size="md"
                      style={styles.cancelBtn}
                    />
                    <Button
                      title="Save to Cellar"
                      onPress={handleConfirm}
                      variant="primary"
                      size="md"
                      style={styles.saveBtn}
                      disabled={!name}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
  style?: any;
}) {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  photoContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 16,
  },
  confidenceBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(26, 29, 36, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.success,
  },
  fields: {
    gap: 12,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  ratingStar: {
    fontSize: 28,
    color: Colors.textMuted,
  },
  ratingStarActive: {
    color: Colors.primaryLight,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 0.4,
  },
  saveBtn: {
    flex: 0.6,
  },
});
