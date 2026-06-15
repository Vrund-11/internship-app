import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import Colors from "@/constants/Colors";

export interface ApiPet {
  id: string;
  name: string;
  type: "dog" | "cat";
  breed: string;
  age: number;
  weight: number;
}

interface PetSelectorProps {
  pets: ApiPet[];
  selectedPets: ApiPet[];
  onSelect: (pets: ApiPet[]) => void;
  onAddPet: (pet: { name: string; type: "dog" | "cat"; breed: string; age: string; weight: string }) => void;
  themeColor?: string;
  softThemeColor?: string;
}

const dogBreeds = ["Labrador", "Golden Retriever", "German Shepherd", "Pug", "Beagle", "Indie"];
const catBreeds = ["Persian", "Siamese", "Maine Coon", "British Shorthair", "Indie"];

export default function PetSelector({
  pets,
  selectedPets,
  onSelect,
  onAddPet,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: PetSelectorProps) {
  const [showPetForm, setShowPetForm] = useState(false);
  const [newPet, setNewPet] = useState({ name: "", type: "dog" as "dog" | "cat", breed: "", age: "", weight: "" });

  const handleSave = () => {
    if (!newPet.name || !newPet.breed) return;
    onAddPet(newPet);
    setNewPet({ name: "", type: "dog", breed: "", age: "", weight: "" });
    setShowPetForm(false);
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>PET PROFILE</Text>

      {/* Pets list */}
      <View style={styles.listGap}>
        {pets.map((pet) => {
          const isSelected = selectedPets.some((p) => p.id === pet.id);
          return (
            <Pressable
              key={pet.id}
              onPress={() => {
                if (isSelected) {
                  onSelect(selectedPets.filter((p) => p.id !== pet.id));
                } else {
                  onSelect([pet]);
                }
              }}
              style={[
                styles.itemCard,
                isSelected ? { borderColor: themeColor, backgroundColor: softThemeColor } : styles.itemCardInactive,
              ]}
            >
              <View style={[styles.itemAvatar, isSelected ? { backgroundColor: themeColor + "22" } : null]}>
                <Text style={{ fontSize: 26 }}>{pet.type === "dog" ? "🐕" : "🐈"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{pet.name}</Text>
                <Text style={styles.itemMeta}>
                  {pet.breed} · {pet.age} yrs · {pet.weight} kg
                </Text>
              </View>
              <View style={[styles.radioCircle, isSelected ? { borderColor: themeColor } : null]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: themeColor }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Add pet CTA / Form */}
      {!showPetForm ? (
        <Pressable onPress={() => setShowPetForm(true)} style={[styles.dashedAddBtn, { borderColor: themeColor }]}>
          <Text style={[styles.dashedAddBtnText, { color: themeColor }]}>+ Add a Pet</Text>
        </Pressable>
      ) : (
        <View style={styles.inlineForm}>
          <View style={styles.typeSelectorRow}>
            <Pressable
              onPress={() => setNewPet(prev => ({ ...prev, type: "dog", breed: "" }))}
              style={[styles.typeBtn, newPet.type === "dog" ? { backgroundColor: softThemeColor } : null]}
            >
              <Text style={[styles.typeBtnText, newPet.type === "dog" ? { color: themeColor } : null]}>🐕 Dog</Text>
            </Pressable>
            <Pressable
              onPress={() => setNewPet(prev => ({ ...prev, type: "cat", breed: "" }))}
              style={[styles.typeBtn, newPet.type === "cat" ? styles.typeBtnCatActive : null]}
            >
              <Text style={[styles.typeBtnText, newPet.type === "cat" ? { color: "#b45309" } : null]}>🐈 Cat</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Pet name"
            placeholderTextColor={Colors.light.textTertiary}
            value={newPet.name}
            onChangeText={v => setNewPet(prev => ({ ...prev, name: v }))}
          />

          {/* Suggested Breeds */}
          <View style={styles.breedSuggestions}>
            <Text style={styles.suggestLabel}>Suggestions: </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(newPet.type === "dog" ? dogBreeds : catBreeds).map(b => (
                <Pressable
                  key={b}
                  onPress={() => setNewPet(prev => ({ ...prev, breed: b }))}
                  style={styles.suggestionTag}
                >
                  <Text style={styles.suggestionTagText}>{b}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Breed"
            placeholderTextColor={Colors.light.textTertiary}
            value={newPet.breed}
            onChangeText={v => setNewPet(prev => ({ ...prev, breed: v }))}
          />

          <View style={styles.twoColumnRow}>
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              placeholder="Age (yrs)"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="numeric"
              value={newPet.age}
              onChangeText={v => setNewPet(prev => ({ ...prev, age: v }))}
            />
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              placeholder="Weight (kg)"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="numeric"
              value={newPet.weight}
              onChangeText={v => setNewPet(prev => ({ ...prev, weight: v }))}
            />
          </View>

          <View style={styles.formActionsRow}>
            <Pressable onPress={() => setShowPetForm(false)} style={styles.formCancelBtn}>
              <Text style={styles.formCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!newPet.name || !newPet.breed}
              onPress={handleSave}
              style={[
                styles.formSubmitBtn,
                { backgroundColor: themeColor },
                (!newPet.name || !newPet.breed) ? styles.formSubmitBtnDisabled : null
              ]}
            >
              <Text style={styles.formSubmitText}>Save Pet</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    fontFamily: Colors.fonts.bold,
  },
  listGap: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  itemCardInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
  },
  itemAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F3EEF1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    fontFamily: Colors.fonts.medium,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D4B8D0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: Colors.light.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  dashedAddBtn: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D4B8D0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  dashedAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.primary,
    fontFamily: Colors.fonts.bold,
  },
  inlineForm: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3EEF1",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnCatActive: {
    backgroundColor: "#FEF3C7",
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A6888",
    fontFamily: Colors.fonts.bold,
  },
  typeBtnTextActive: {
    color: Colors.light.primary,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: "#ffffff",
    fontFamily: Colors.fonts.medium,
  },
  breedSuggestions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  suggestLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    fontFamily: Colors.fonts.semiBold,
  },
  suggestionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.light.muted,
    marginRight: 6,
  },
  suggestionTagText: {
    fontSize: 11,
    color: Colors.light.text,
    fontWeight: "500",
    fontFamily: Colors.fonts.medium,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },
  formActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  formCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  formCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.bold,
  },
  formSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  formSubmitBtnDisabled: {
    opacity: 0.5,
  },
  formSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: Colors.fonts.bold,
  },
});
