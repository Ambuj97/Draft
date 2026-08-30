import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { getLocales } from "expo-localization";
import { Text } from "@/components/ui/Text";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { useTheme } from "@/components/ui/ThemeContext";
import { BeerExtraction } from "@/services/vision";
import { space, radius } from "@/constants/theme";

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

const CENTRAL_BEERS = [
  "Punk IPA", "Neck Oil", "Hazy Jane", "Gamma Ray", "Pale Ale", "Guinness",
  "Camden Hells", "Dead Pony Club",
];
const CENTRAL_BREWERIES = [
  "BrewDog", "Beavertown", "Camden Town", "Guinness", "Cloudwater", "Deya", "Verdant",
];

/** Bottom sheet to confirm/edit AI-extracted beer details before saving. */
export function BeerConfirmSheet({
  visible,
  photoUri,
  extraction,
  isLoading,
  onConfirm,
  onCancel,
}: BeerConfirmSheetProps) {
  const { colors } = useTheme();
  const currency = getLocales()[0]?.currencySymbol || "£";

  const [name, setName] = useState("");
  const [brewery, setBrewery] = useState("");
  const [abv, setAbv] = useState("");
  const [price, setPrice] = useState("");
  const [venue, setVenue] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (extraction) {
      setName(extraction.name || "");
      setBrewery(extraction.brewery || "");
      setAbv(extraction.abv?.toString() || "");
    }
  }, [extraction]);

  const confirm = () =>
    onConfirm({ name, brewery, abv, price, venue, rating, notes });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.scrim} onPress={onCancel} />
        <View style={[styles.sheet, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={[styles.grip, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text variant="heading">{isLoading ? "Reading the label…" : "Confirm beer"}</Text>

            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text variant="body" color="secondary" style={{ marginTop: space.md }}>
                  Pulling out the details.
                </Text>
              </View>
            ) : (
              <>
                {photoUri ? (
                  <View style={styles.photoWrap}>
                    <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                    {extraction ? (
                      <View style={styles.badge}>
                        <Tag
                          label={`${Math.round(extraction.confidence * 100)}% match`}
                          tone="success"
                        />
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={{ gap: space.md, marginTop: space.lg }}>
                  <View style={{ zIndex: 20 }}>
                    <AutocompleteInput
                      label="Beer name"
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Punk IPA"
                      suggestions={CENTRAL_BEERS}
                    />
                  </View>
                  <View style={{ zIndex: 10 }}>
                    <AutocompleteInput
                      label="Brewery"
                      value={brewery}
                      onChangeText={setBrewery}
                      placeholder="e.g. BrewDog"
                      suggestions={CENTRAL_BREWERIES}
                    />
                  </View>

                  <View style={styles.pair}>
                    <Field
                      label="ABV %"
                      value={abv}
                      onChangeText={setAbv}
                      placeholder="5.4"
                      keyboardType="decimal-pad"
                      containerStyle={{ flex: 1 }}
                    />
                    <Field
                      label={`Price (${currency})`}
                      value={price}
                      onChangeText={setPrice}
                      placeholder="5.80"
                      keyboardType="decimal-pad"
                      containerStyle={{ flex: 1 }}
                    />
                  </View>

                  <Field
                    label="Venue"
                    value={venue}
                    onChangeText={setVenue}
                    placeholder="Where are you drinking?"
                  />

                  <View>
                    <Text variant="label" color="muted" style={{ marginBottom: space.sm }}>
                      RATING
                    </Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
                          <Text style={{ fontSize: 26, color: colors.accent }}>
                            {star <= rating ? "★" : "☆"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <Field
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Tasting notes, thoughts…"
                    multiline
                  />
                </View>

                <View style={styles.actions}>
                  <Button title="Cancel" onPress={onCancel} variant="ghost" />
                  <Button
                    title="Save to Cellar"
                    onPress={confirm}
                    disabled={!name}
                    fullWidth
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27,23,18,0.35)",
  },
  sheet: {
    maxHeight: "92%",
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
  loading: {
    alignItems: "center",
    paddingVertical: space.x3,
  },
  photoWrap: {
    marginTop: space.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: 170,
  },
  badge: {
    position: "absolute",
    bottom: space.sm,
    right: space.sm,
  },
  pair: {
    flexDirection: "row",
    gap: space.md,
  },
  stars: {
    flexDirection: "row",
    gap: space.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginTop: space.xl,
  },
});
