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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Static location structure matching the web app
interface LocationOption {
  name: string;
  active: boolean;
}

const statesList: LocationOption[] = [
  { name: "Gujarat", active: true },
  { name: "Maharashtra", active: true },
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
    { name: "Mumbai", active: true },
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
  const [selectedState, setSelectedState] = useState<string>(statesList[0]?.name ?? "");
  const [error, setError] = useState("");
  const { setCity } = useCity();
  const router = useRouter();

  useEffect(() => {
    api
      .get("/cities")
      .then((res) => setApiCities(res.data ?? []))
      .catch((err) => {
        console.error("Failed to fetch cities", err);
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

  const handleSkip = () => {
    router.replace("/home" as any);
  };

  const visibleCities = selectedState ? citiesList[selectedState] ?? [] : [];
  const colWidth = (SCREEN_WIDTH - 52) / 2; // Two columns grid width calculation

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Badge */}
          <Text style={styles.setupText}>SETUP</Text>
          
          {/* Titles */}
          <Text style={styles.title}>Select Your City</Text>
          <Text style={styles.subtitle}>
            Pick your state and city. If we are not available yet, you will see “Coming soon.”
          </Text>

          {/* Grid Layout Container */}
          <View style={styles.sectionsContainer}>
            {/* States section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>States</Text>
                {loading ? <ActivityIndicator size="small" color={Colors.light.primary} /> : null}
              </View>
              <View style={styles.listContainer}>
                {statesList.map((state) => {
                  const isSelected = selectedState === state.name;
                  return (
                    <Pressable
                      key={state.name}
                      onPress={() => setSelectedState(state.name)}
                      style={[
                        styles.stateButton,
                        isSelected ? styles.stateButtonActive : styles.stateButtonInactive,
                        !state.active ? styles.comingSoonOpacity : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stateText,
                          isSelected ? styles.stateTextActive : styles.stateTextInactive,
                        ]}
                      >
                        {state.name}
                      </Text>
                      {!state.active ? (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming soon</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Cities section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cities</Text>
              
              {visibleCities.length === 0 ? (
                <View style={styles.emptyCities}>
                  <Text style={styles.emptyCitiesText}>Select a state to see cities.</Text>
                </View>
              ) : (
                <View style={styles.citiesGrid}>
                  {visibleCities.map((city) => {
                    return (
                      <Pressable
                        key={city.name}
                        disabled={!city.active}
                        onPress={() => handleSelectCity(city.name)}
                        style={({ pressed }) => [
                          styles.cityButton,
                          { width: colWidth },
                          city.active
                            ? pressed
                              ? styles.cityButtonActive
                              : styles.cityButtonInactive
                            : styles.cityButtonDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cityText,
                            city.active ? styles.cityTextActive : styles.cityTextDisabled,
                          ]}
                        >
                          {city.name}
                        </Text>
                        {!city.active ? (
                          <View style={[styles.comingSoonBadge, { marginTop: 4, alignSelf: "flex-start" }]}>
                            <Text style={styles.comingSoonText}>Coming soon</Text>
                          </View>
                        ) : null}
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
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Footer Info & Skip Button */}
          <View style={styles.footer}>
            <Text style={styles.footerInfoText}>
              You can browse services even if your city is not available yet.
            </Text>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  setupText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.light.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 10,
  },
  listContainer: {
    gap: 10,
  },
  stateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stateButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  stateButtonInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
  },
  stateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stateTextActive: {
    color: Colors.light.primary,
  },
  stateTextInactive: {
    color: Colors.light.text,
  },
  comingSoonOpacity: {
    opacity: 0.7,
  },
  comingSoonBadge: {
    backgroundColor: Colors.light.muted,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  emptyCities: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.light.border,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCitiesText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  citiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cityButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  cityButtonInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
  },
  cityButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  cityButtonDisabled: {
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.muted,
  },
  cityText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cityTextActive: {
    color: Colors.light.text,
  },
  cityTextDisabled: {
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    backgroundColor: "rgba(224, 92, 53, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
  },
  errorText: {
    color: Colors.light.destructive,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  footer: {
    marginTop: 28,
    gap: 16,
  },
  footerInfoText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  skipButton: {
    height: 48,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
