import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useBooking } from "@/context/BookingContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";
import type { ServiceType } from "@canovet/shared";
import { validateName, validateBreed } from "@canovet/shared";

type PetType = "dog" | "cat";

type Pet = {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: number;
  weight: number;
};

export default function BookingPetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ service: string }>();
  const { setService, setPet } = useBooking();

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPet, setNewPet] = useState({
    name: "",
    type: "dog" as PetType,
    breed: "",
    age: "",
    weight: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.service) {
      setService(params.service as ServiceType);
    }
  }, [params.service]);

  useEffect(() => {
    api
      .get("/booking/pets")
      .then((res) => {
        const apiPets = (res.data.pets ?? []) as Pet[];
        setPets(
          apiPets.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type ?? "dog",
            breed: p.breed ?? "Mixed",
            age: p.age ?? 2,
            weight: p.weight ?? 8,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddPet = async () => {
    const nameError = validateName(newPet.name);
    if (nameError) {
      Alert.alert("Invalid Input", nameError);
      return;
    }
    const breedError = validateBreed(newPet.breed);
    if (breedError) {
      Alert.alert("Invalid Input", breedError);
      return;
    }
    const ageNum = Number(newPet.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 30) {
      Alert.alert("Invalid Input", "Please enter a valid age (1-30)");
      return;
    }
    const weightNum = Number(newPet.weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 150) {
      Alert.alert("Invalid Input", "Please enter a valid weight (1-150)");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/booking/pets", {
        name: newPet.name,
        type: newPet.type,
        breed: newPet.breed,
        age: ageNum,
        weight: weightNum,
      });
      const created: Pet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type ?? "dog",
        breed: res.data.breed ?? "Mixed",
        age: res.data.age ?? 2,
        weight: res.data.weight ?? 5,
      };
      setPets((prev) => [...prev, created]);
      setSelectedPetId(created.id);
      setShowAddForm(false);
      setNewPet({ name: "", type: "dog", breed: "", age: "", weight: "" });
    } catch {
      Alert.alert("Error", "Failed to add pet");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!selectedPetId) return;
    setPet(selectedPetId);
    router.push("/booking/address");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Select Your Pet</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.light.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>PET PROFILE</Text>

            {pets.map((pet, index) => {
              const isSelected = selectedPetId === pet.id;
              return (
                <Animated.View
                  key={pet.id}
                  entering={FadeInDown.delay(index * 80).duration(400)}
                >
                  <Pressable
                    style={[
                      styles.petCard,
                      isSelected && styles.petCardSelected,
                    ]}
                    onPress={() => setSelectedPetId(pet.id)}
                  >
                    <View style={styles.petAvatar}>
                      <Text style={styles.petAvatarEmoji}>
                        {pet.type === "dog" ? "🐕" : "🐈"}
                      </Text>
                    </View>
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petDetails}>
                        {pet.breed} · {pet.age} yrs · {pet.weight} kg
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        isSelected && styles.radioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* Add Pet */}
            {!showAddForm ? (
              <Pressable
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addButtonText}>＋ Add a Pet</Text>
              </Pressable>
            ) : (
              <View style={styles.addForm}>
                {/* Type toggle */}
                <View style={styles.typeRow}>
                  <Pressable
                    style={[
                      styles.typeButton,
                      newPet.type === "dog" && styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setNewPet((prev) => ({ ...prev, type: "dog" }))
                    }
                  >
                    <Text style={styles.typeButtonText}>🐕 Dog</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.typeButton,
                      newPet.type === "cat" && styles.typeButtonCatActive,
                    ]}
                    onPress={() =>
                      setNewPet((prev) => ({ ...prev, type: "cat" }))
                    }
                  >
                    <Text style={styles.typeButtonText}>🐈 Cat</Text>
                  </Pressable>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Pet name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={newPet.name}
                  onChangeText={(text) =>
                    setNewPet((prev) => ({ ...prev, name: text }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Breed"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={newPet.breed}
                  onChangeText={(text) =>
                    setNewPet((prev) => ({ ...prev, breed: text }))
                  }
                />
                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Age (yrs)"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="numeric"
                    value={newPet.age}
                    onChangeText={(text) =>
                      setNewPet((prev) => ({ ...prev, age: text }))
                    }
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Weight (kg)"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="numeric"
                    value={newPet.weight}
                    onChangeText={(text) =>
                      setNewPet((prev) => ({ ...prev, weight: text }))
                    }
                  />
                </View>
                <View style={styles.formActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.saveButton,
                      (!newPet.name || !newPet.breed || saving) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleAddPet}
                    disabled={!newPet.name || !newPet.breed || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Pet</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.continueButton,
            !selectedPetId && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedPetId}
        >
          <Text style={styles.continueButtonText}>Continue to Address</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
  },
  stepIndicator: { flexDirection: "row", gap: 6 },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  stepDotActive: { backgroundColor: Colors.light.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  petCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FBF0FB",
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.light.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  petAvatarEmoji: { fontSize: 26 },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  petDetails: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D4B8D0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: { borderColor: Colors.light.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },

  addButton: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D4B8D0",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.primary,
  },

  addForm: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3EEF1",
    alignItems: "center",
  },
  typeButtonActive: { backgroundColor: Colors.light.primarySoft },
  typeButtonCatActive: { backgroundColor: "#FEF3C7" },
  typeButtonText: { fontSize: 13, fontWeight: "700", color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  rowInputs: { flexDirection: "row", gap: 10 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
  },
  saveButtonText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  buttonDisabled: { opacity: 0.5 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
