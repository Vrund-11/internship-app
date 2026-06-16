import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import Colors from "@/constants/Colors";
import { ApiPet } from "./PetSelector";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  dogPrice: number;
  catPrice: number;
  icon: string;
  duration: string;
}

interface ServicePickerProps {
  services: ServiceItem[];
  selectedServices: ServiceItem[];
  selectedPets: ApiPet[];
  onSelect: (services: ServiceItem[]) => void;
  themeColor?: string;
  softThemeColor?: string;
}

const serviceIcons: Record<string, string> = {
  bath: "🛁",
  scissors: "✂️",
  hand: "🐾",
  ear: "👂",
  smile: "🐶",
  sparkles: "✨",
  stethoscope: "🩺",
  syringe: "💉",
  pill: "💊",
  "shield-plus": "🛡️",
  hospital: "🏥",
  scan: "🩺",
  droplets: "🩸",
  activity: "📈",
};

export default function ServicePicker({
  services,
  selectedServices,
  selectedPets,
  onSelect,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: ServicePickerProps) {
  const subtotal = selectedPets.reduce((total, pet) => {
    return total + selectedServices.reduce((sub, svc) => {
      return sub + (pet.type === "cat" ? svc.catPrice : svc.dogPrice);
    }, 0);
  }, 0);

  const toggleService = (svc: ServiceItem) => {
    const isSelected = selectedServices.some(s => s.id === svc.id);
    if (isSelected) {
      onSelect(selectedServices.filter(s => s.id !== svc.id));
    } else {
      onSelect([...selectedServices, svc]);
    }
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>CHOOSE SERVICES</Text>

      <View style={styles.listGap}>
        {services.map((svc) => {
          const isSelected = selectedServices.some(s => s.id === svc.id);
          const hasDog = selectedPets.some(p => p.type === "dog");
          const hasCat = selectedPets.some(p => p.type === "cat");

          return (
            <Pressable
              key={svc.id}
              onPress={() => toggleService(svc)}
              style={[
                styles.itemCard,
                isSelected ? { borderColor: themeColor, backgroundColor: softThemeColor } : styles.itemCardInactive,
              ]}
            >
              <View style={styles.serviceIconContainer}>
                <Text style={{ fontSize: 20 }}>{serviceIcons[svc.icon] || "✨"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{svc.name}</Text>
                <Text style={styles.itemMeta} numberOfLines={2}>{svc.description}</Text>
                <View style={styles.badgeRow}>
                  {hasDog && (
                    <View style={[styles.badgeDog, { backgroundColor: themeColor + "18" }]}>
                      <Text style={[styles.badgeDogText, { color: themeColor }]}>🐕 ₹{svc.dogPrice}</Text>
                    </View>
                  )}
                  {hasCat && (
                    <View style={styles.badgeCat}>
                      <Text style={styles.badgeCatText}>🐈 ₹{svc.catPrice}</Text>
                    </View>
                  )}
                  <View style={styles.badgeDuration}>
                    <Text style={styles.badgeDurationText}>⏱ {svc.duration}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.radioCircle, isSelected ? { borderColor: themeColor } : null]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: themeColor }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Total Card */}
      {selectedServices.length > 0 && (
        <View style={[styles.totalEstimateCard, { backgroundColor: softThemeColor, borderColor: themeColor + "33" }]}>
          <View>
            <Text style={[styles.totalEstimateTitle, { color: themeColor }]}>TOTAL EST.</Text>
            <Text style={[styles.totalEstimateAmt, { color: themeColor }]}>₹{subtotal}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.totalEstimateSub, { color: themeColor }]}>{selectedServices.length} service(s)</Text>
            <Text style={[styles.totalEstimateSub, { color: themeColor }]}>× {selectedPets.length} pet(s)</Text>
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
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3EEF1",
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    marginTop: 2,
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
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  badgeDog: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeDogText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Colors.fonts.bold,
  },
  badgeCat: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCatText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
    fontFamily: Colors.fonts.bold,
  },
  badgeDuration: {
    backgroundColor: "#F3EEF1",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeDurationText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8A6888",
    fontFamily: Colors.fonts.bold,
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
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  totalEstimateCard: {
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalEstimateTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.bold,
  },
  totalEstimateAmt: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
    fontFamily: Colors.fonts.extraBold,
  },
  totalEstimateSub: {
    fontSize: 11,
    fontFamily: Colors.fonts.medium,
  },
});
