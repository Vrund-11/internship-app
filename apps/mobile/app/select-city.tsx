import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LocationOption {
  name: string;
  active: boolean;
}

const statesList: LocationOption[] = [
  { name: "Gujarat", active: true },
  { name: "Maharashtra", active: false },
  { name: "Rajasthan", active: false },
  { name: "Karnataka", active: false },
  { name: "Delhi", active: false },
];

const citiesList: Record<string, LocationOption[]> = {
  Gujarat: [
    { name: "Ahmedabad", active: true },
    { name: "Surat", active: false },
    { name: "Vadodara", active: false },
    { name: "Rajkot", active: false },
  ],
  Maharashtra: [
    { name: "Mumbai", active: false },
    { name: "Pune", active: false },
  ],
  Rajasthan: [
    { name: "Jaipur", active: false },
    { name: "Udaipur", active: false },
  ],
  Karnataka: [
    { name: "Bangalore", active: false },
    { name: "Mysore", active: false },
  ],
  Delhi: [{ name: "New Delhi", active: false }],
};

interface ApiCity {
  id: string;
  name: string;
  state: string;
}

export default function SelectCityScreen() {
  const [apiCities, setApiCities] = useState<ApiCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("Gujarat");
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [isStateOpen, setIsStateOpen] = useState(true); // Default open first accordion
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [error, setError] = useState("");
  
  const { setCity } = useCity();
  const router = useRouter();

  useEffect(() => {
    api
      .get("/cities")
      .then((res) => setApiCities(res.data ?? []))
      .catch((err) => {
        console.error("Failed to fetch active cities on mobile", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCitiesByName = useMemo(() => {
    return new Map<string, ApiCity>(
      apiCities.map((city) => [city.name.toLowerCase(), city])
    );
  }, [apiCities]);

  const handleSelectCity = (cityName: string) => {
    const match = activeCitiesByName.get(cityName.toLowerCase());

    if (!match) {
      setError("That city is not available yet. Please choose an active city.");
      return;
    }

    setError("");
    setCity(match);
    router.replace("/home" as any);
  };

  const handleStatePress = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCityName(""); // Reset city choice on state change
    setIsStateOpen(false);
    setIsCityOpen(true); // Auto-expand city selection for quick onboarding
    setError("");
  };

  const handleCityPress = (cityName: string, active: boolean) => {
    if (!active) return;
    setSelectedCityName(cityName);
    setIsCityOpen(false);
    setError("");
  };

  const handleConfirm = () => {
    if (!selectedCityName) {
      setError("Please select a city first.");
      return;
    }
    handleSelectCity(selectedCityName);
  };

  const handleSkip = () => {
    router.replace("/home" as any);
  };

  const visibleCities = selectedState ? citiesList[selectedState] ?? [] : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Top Navigation Bar */}
      <View style={styles.headerRow}>
        <Text style={styles.brandTitle}>canovet</Text>
        <Pressable onPress={handleSkip} style={styles.skipHeaderBtn}>
          <Text style={styles.skipHeaderBtnText}>Skip</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Soft Background Art */}
        <View style={styles.bgGlow} />

        <View style={styles.card}>
          {/* Header Info */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.title}>Select Your Location</Text>
            <Text style={styles.subtitle}>
              Pick your state and city. You can skip if your location isn't active yet.
            </Text>
          </View>

          {/* Accordion List */}
          <View style={styles.accordionContainer}>
            {/* 1. STATE SELECTOR ACCORDION */}
            <View style={styles.accordion}>
              <Pressable
                onPress={() => {
                  setIsStateOpen(!isStateOpen);
                  setIsCityOpen(false);
                }}
                style={[
                  styles.accordionHeader,
                  isStateOpen && styles.accordionHeaderOpen,
                ]}
              >
                <View style={styles.accordionHeaderLeft}>
                  <Ionicons name="map-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.accordionHeaderTitle}>
                    {selectedState ? `State: ${selectedState}` : "Select State"}
                  </Text>
                </View>
                <Ionicons
                  name={isStateOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.light.textSecondary}
                />
              </Pressable>

              {isStateOpen && (
                <View style={styles.accordionBody}>
                  {statesList.map((state) => {
                    const isSelected = selectedState === state.name;
                    return (
                      <Pressable
                        key={state.name}
                        onPress={() => handleStatePress(state.name)}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemActive,
                          !state.active && styles.optionItemDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextActive,
                          ]}
                        >
                          {state.name}
                        </Text>
                        <View style={styles.optionRight}>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} />
                          )}
                          {!state.active && (
                            <View style={styles.comingSoonBadge}>
                              <Text style={styles.comingSoonText}>Coming soon</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 2. CITY SELECTOR ACCORDION */}
            <View style={styles.accordion}>
              <Pressable
                onPress={() => {
                  if (!selectedState) return;
                  setIsCityOpen(!isCityOpen);
                  setIsStateOpen(false);
                }}
                disabled={!selectedState}
                style={[
                  styles.accordionHeader,
                  isCityOpen && styles.accordionHeaderOpen,
                  !selectedState && styles.accordionHeaderDisabled,
                ]}
              >
                <View style={styles.accordionHeaderLeft}>
                  <Ionicons name="business-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.accordionHeaderTitle}>
                    {selectedCityName ? `City: ${selectedCityName}` : "Select City"}
                  </Text>
                </View>
                <Ionicons
                  name={isCityOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.light.textSecondary}
                />
              </Pressable>

              {isCityOpen && (
                <View style={styles.accordionBody}>
                  {visibleCities.map((city) => {
                    const isSelected = selectedCityName === city.name;
                    return (
                      <Pressable
                        key={city.name}
                        disabled={!city.active}
                        onPress={() => handleCityPress(city.name, city.active)}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemActive,
                          !city.active && styles.optionItemDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextActive,
                          ]}
                        >
                          {city.name}
                        </Text>
                        <View style={styles.optionRight}>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} />
                          )}
                          {!city.active && (
                            <View style={styles.comingSoonBadge}>
                              <Text style={styles.comingSoonText}>Coming soon</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.light.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Action CTAs */}
          <View style={styles.actions}>
            <Pressable
              disabled={!selectedCityName}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                !selectedCityName && styles.confirmBtnDisabled,
                pressed && styles.confirmBtnPressed,
              ]}
            >
              <LinearGradient
                colors={selectedCityName ? [Colors.light.primary, Colors.light.primaryLight] : ["#E5E5E5", "#E5E5E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Confirm Location</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleSkip} style={styles.skipFooterBtn}>
              <Text style={styles.skipFooterBtnText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerNote}>
          We are currently expanding to newer hubs. Select Ahmedabad to test the full flow.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBF0",
    backgroundColor: "#FFFFFF",
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: Colors.fonts.extraBold,
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  skipHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: "#F5EEF4",
  },
  skipHeaderBtnText: {
    fontSize: 13,
    fontFamily: Colors.fonts.bold,
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bgGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(255, 16, 240, 0.08)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0EBF0",
    padding: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: Colors.fonts.bold,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Colors.fonts.medium,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  accordionContainer: {
    gap: 14,
  },
  accordion: {
    borderWidth: 1,
    borderColor: "#EAE2EA",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  accordionHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FAFAF9",
  },
  accordionHeaderOpen: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAE2EA",
    backgroundColor: "#FFFFFF",
  },
  accordionHeaderDisabled: {
    opacity: 0.5,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accordionHeaderTitle: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: Colors.light.text,
  },
  accordionBody: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  optionItem: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FAFAF9",
  },
  optionItemActive: {
    backgroundColor: Colors.light.primarySoft,
  },
  optionItemDisabled: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 14,
    fontFamily: Colors.fonts.medium,
    color: Colors.light.text,
  },
  optionTextActive: {
    color: Colors.light.primary,
    fontFamily: Colors.fonts.bold,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  comingSoonBadge: {
    backgroundColor: "#EAE4EA",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontFamily: Colors.fonts.bold,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224, 92, 53, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Colors.fonts.medium,
    color: Colors.light.destructive,
    flex: 1,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmBtnPressed: {
    transform: [{ scale: 0.99 }],
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: Colors.fonts.bold,
    color: "#FFFFFF",
  },
  skipFooterBtn: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE2EA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  skipFooterBtnText: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: Colors.light.textSecondary,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: Colors.fonts.medium,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 16,
  },
});

