import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  rating: number;
  totalCompleted: number;
}

interface ClinicSearchPickerProps {
  selectedClinic: Clinic | null;
  onSelect: (clinic: Clinic) => void;
  clinicsList: Clinic[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loadingClinics: boolean;
  themeColor?: string;
  softThemeColor?: string;
}

const defaultClinics: Clinic[] = [
  { id: "ramesh-vet", name: "Dr. Ramesh (Vet)", address: "Navrangpura, Ahmedabad", rating: 4.8, totalCompleted: 150 },
  { id: "canovet-clinic", name: "CanoVet Clinic", address: "Satellite Area, Ahmedabad", rating: 4.9, totalCompleted: 280 }
];

export default function ClinicSearchPicker({
  selectedClinic,
  onSelect,
  clinicsList,
  searchQuery,
  onSearchChange,
  loadingClinics,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: ClinicSearchPickerProps) {
  const displayedClinics = clinicsList.length > 0
    ? clinicsList
    : defaultClinics.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>FIND A CLINIC</Text>
      
      <TextInput
        style={[styles.clinicSearchInput, { backgroundColor: softThemeColor + "33", borderColor: Colors.light.border }]}
        placeholder="Search by clinic name or area..."
        placeholderTextColor={Colors.light.textTertiary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />

      {loadingClinics ? (
        <ActivityIndicator size="small" color={themeColor} style={{ marginVertical: 12 }} />
      ) : displayedClinics.length === 0 ? (
        <Text style={styles.emptyText}>No clinics found matching "{searchQuery}"</Text>
      ) : (
        <View style={styles.listGap}>
          {displayedClinics.map((clinic) => {
            const isSelected = selectedClinic?.id === clinic.id;
            const isCanoVet = clinic.id === "canovet-clinic";

            return (
              <Pressable
                key={clinic.id}
                onPress={() => onSelect(clinic)}
                style={[
                  styles.itemCard,
                  isSelected ? { borderColor: themeColor, backgroundColor: softThemeColor } : styles.itemCardInactive,
                ]}
              >
                {isSelected && (
                  <View style={[styles.activeCheckmarkBadge, { backgroundColor: themeColor }]}>
                    <Text style={styles.activeCheckmarkText}>✓</Text>
                  </View>
                )}
                <View style={[styles.clinicAvatar, isSelected ? { backgroundColor: themeColor + "22" } : null]}>
                  <Text style={{ fontSize: 20 }}>🏥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{clinic.name}</Text>
                  <Text style={styles.itemMeta}>{clinic.address}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.itemRatingText}>★ {clinic.rating} ({clinic.totalCompleted})</Text>
                    {isCanoVet && (
                      <View style={[styles.nearestBadge, { backgroundColor: themeColor + "22" }]}>
                        <Text style={[styles.nearestBadgeText, { color: themeColor }]}>NEAREST</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[styles.radioCircle, isSelected ? { borderColor: themeColor } : null]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: themeColor }]} />}
                </View>
              </Pressable>
            );
          })}
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
  clinicSearchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: Colors.fonts.medium,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginVertical: 12,
    fontFamily: Colors.fonts.medium,
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
    position: "relative",
    overflow: "hidden",
  },
  itemCardInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
  },
  clinicAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FBF0FB",
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  itemRatingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#b45309",
    fontFamily: Colors.fonts.semiBold,
  },
  nearestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  nearestBadgeText: {
    fontSize: 8,
    fontWeight: "800",
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
  activeCheckmarkBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  activeCheckmarkText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
