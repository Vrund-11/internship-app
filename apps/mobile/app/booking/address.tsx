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
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useBooking } from "@/context/BookingContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";
import { validateHouse, validateArea, validateCity, validateState, validatePincode } from "@canovet/shared";

type Address = {
  id: string;
  label: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

const LABEL_ICONS: Record<string, string> = {
  Home: "🏠",
  Office: "🏢",
  Other: "📍",
};

export default function BookingAddressScreen() {
  const router = useRouter();
  const { setAddress } = useBooking();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    label: "Home",
    house: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await api.get("/booking/addresses/autocomplete", {
        params: { query: val },
      });
      if (res.data && res.data.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.error("Autocomplete failed", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (s: any) => {
    setSearchQuery(s.label);
    setForm((prev) => ({
      ...prev,
      city: s.city,
      state: s.state,
      area: s.area,
      pincode: s.pincode,
    }));
    setSelectedCoords({
      latitude: s.latitude,
      longitude: s.longitude,
    });
    setSuggestions([]);
  };

  useEffect(() => {
    api
      .get("/booking/addresses")
      .then((res) => {
        const apiAddresses = (res.data.addresses ?? []) as Address[];
        setAddresses(
          apiAddresses.map((a) => ({
            id: a.id,
            label: a.label ?? "Home",
            house: a.house ?? "",
            area: a.area ?? "",
            city: a.city ?? "",
            state: a.state ?? "",
            pincode: a.pincode ?? "",
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddAddress = async () => {
    const houseError = validateHouse(form.house);
    if (houseError) {
      Alert.alert("Invalid Input", houseError);
      return;
    }
    const areaError = validateArea(form.area);
    if (areaError) {
      Alert.alert("Invalid Input", areaError);
      return;
    }
    const cityError = validateCity(form.city);
    if (cityError) {
      Alert.alert("Invalid Input", cityError);
      return;
    }
    const stateError = validateState(form.state);
    if (stateError) {
      Alert.alert("Invalid Input", stateError);
      return;
    }
    const pincodeError = validatePincode(form.pincode);
    if (pincodeError) {
      Alert.alert("Invalid Input", pincodeError);
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/booking/addresses", {
        ...form,
        latitude: selectedCoords?.latitude,
        longitude: selectedCoords?.longitude,
      });
      const created: Address = {
        id: res.data.id,
        ...form,
      };
      setAddresses((prev) => [...prev, created]);
      setSelectedId(created.id);
      setShowForm(false);
      setForm({ label: "Home", house: "", area: "", city: "", state: "", pincode: "" });
      setSearchQuery("");
      setSelectedCoords(null);
    } catch {
      Alert.alert("Error", "Failed to add address");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!selectedId) return;
    setAddress(selectedId);
    router.push("/booking/schedule");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Select Address</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
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
            <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>

            {addresses.map((addr, index) => {
              const isSelected = selectedId === addr.id;
              return (
                <Animated.View
                  key={addr.id}
                  entering={FadeInDown.delay(index * 80).duration(400)}
                >
                  <Pressable
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedId(addr.id)}
                  >
                    <View style={styles.addressIcon}>
                      <Text style={styles.addressIconText}>
                        {LABEL_ICONS[addr.label] ?? "📍"}
                      </Text>
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      <Text style={styles.addressText}>
                        {addr.house}, {addr.area}
                      </Text>
                      <Text style={styles.addressText}>
                        {addr.city}, {addr.state} - {addr.pincode}
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

            {/* Add Address */}
            {!showForm ? (
              <Pressable
                style={styles.addButton}
                onPress={() => setShowForm(true)}
              >
                <Text style={styles.addButtonText}>＋ Add New Address</Text>
              </Pressable>
            ) : (
              <View style={styles.addForm}>
                {/* Label toggle */}
                <View style={styles.labelRow}>
                  {["Home", "Office", "Other"].map((label) => (
                    <Pressable
                      key={label}
                      style={[
                        styles.labelButton,
                        form.label === label && styles.labelButtonActive,
                      ]}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, label }))
                      }
                    >
                      <Text
                        style={[
                          styles.labelButtonText,
                          form.label === label && styles.labelButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ zIndex: 10, position: "relative", marginBottom: 12 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Search area, landmark or neighborhood..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                  />
                  {loadingSuggestions && (
                    <ActivityIndicator size="small" color={Colors.light.primary} style={{ position: "absolute", right: 12, top: 12 }} />
                  )}
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {suggestions.map((s, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => selectSuggestion(s)}
                          style={styles.suggestionItem}
                        >
                          <Text style={styles.suggestionText}>{s.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {form.city && !["Ahmedabad"].includes(form.city) ? (
                  <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>We are not available in {form.city} yet. Stay tuned!</Text>
                  </View>
                ) : null}

                {form.city && ["Ahmedabad"].includes(form.city) ? (
                  <>
                    <TextInput
                      style={[styles.input, { marginBottom: 12 }]}
                      placeholder="House / Flat / Floor"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={form.house}
                      onChangeText={(t) => setForm((p) => ({ ...p, house: t }))}
                    />
                    <TextInput
                      style={[styles.input, { marginBottom: 12 }]}
                      placeholder="Area / Landmark"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={form.area}
                      onChangeText={(t) => setForm((p) => ({ ...p, area: t }))}
                    />
                    <View style={[styles.rowInputs, { marginBottom: 12 }]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="City"
                        placeholderTextColor={Colors.light.textSecondary}
                        value={form.city}
                        onChangeText={(t) => setForm((p) => ({ ...p, city: t }))}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="State"
                        placeholderTextColor={Colors.light.textSecondary}
                        value={form.state}
                        onChangeText={(t) => setForm((p) => ({ ...p, state: t }))}
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode"
                      placeholderTextColor={Colors.light.textSecondary}
                      keyboardType="numeric"
                      maxLength={6}
                      value={form.pincode}
                      onChangeText={(t) => setForm((p) => ({ ...p, pincode: t }))}
                    />
                  </>
                ) : null}

                <View style={styles.formActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setShowForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.saveButton,
                      (!form.house ||
                        !form.area ||
                        !form.city ||
                        !form.pincode ||
                        saving) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleAddAddress}
                    disabled={
                      !form.house ||
                      !form.area ||
                      !form.city ||
                      !form.pincode ||
                      saving
                    }
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Address</Text>
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
            !selectedId && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedId}
        >
          <Text style={styles.continueButtonText}>Continue to Schedule</Text>
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
  stepDotDone: { backgroundColor: Colors.light.success },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  addressCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FBF0FB",
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  addressIconText: { fontSize: 20 },
  addressInfo: { flex: 1 },
  addressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  addressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D4B8D0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
  labelRow: { flexDirection: "row", gap: 8 },
  labelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  labelButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  labelButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  labelButtonTextActive: { color: "#fff" },
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
  suggestionsContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  warningContainer: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: "#b45309",
    lineHeight: 16,
  },
});
