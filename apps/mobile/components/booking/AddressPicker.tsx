import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import Colors from "@/constants/Colors";

export interface Address {
  id: string;
  label: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressPickerProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
  onAddAddress: (address: { label: string; house: string; area: string; state: string; city: string; pincode: string }) => void;
}

const labelColors: Record<string, string> = {
  Home: "#E8F3FF",
  Office: "#FEF3C7",
  Other: "#F5D6F5",
};

const labelEmojis: Record<string, string> = {
  Home: "🏠",
  Office: "💼",
  Other: "📍",
};

const states = [
  { name: "Gujarat", active: true },
  { name: "Maharashtra", active: true },
  { name: "Rajasthan", active: false },
  { name: "Karnataka", active: false },
  { name: "Delhi", active: false },
];

const cities: Record<string, { name: string; active: boolean }[]> = {
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
};

interface AddressPickerProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
  onAddAddress: (address: { label: string; house: string; area: string; state: string; city: string; pincode: string }) => void;
  themeColor?: string;
  softThemeColor?: string;
}

export default function AddressPicker({
  addresses,
  selectedAddress,
  onSelect,
  onAddAddress,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: AddressPickerProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", house: "", area: "", state: "", city: "", pincode: "" });

  const handleSave = () => {
    if (!newAddress.house || !newAddress.area || !newAddress.city || !newAddress.pincode) return;
    onAddAddress(newAddress);
    setNewAddress({ label: "Home", house: "", area: "", state: "", city: "", pincode: "" });
    setShowAddressForm(false);
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>SERVICE ADDRESS</Text>

      <View style={styles.listGap}>
        {addresses.map((addr) => {
          const isSelected = selectedAddress?.id === addr.id;
          const isServiceable = ["Ahmedabad", "Mumbai"].includes(addr.city);

          return (
            <Pressable
              key={addr.id}
              disabled={!isServiceable}
              onPress={() => onSelect(addr)}
              style={[
                styles.itemCard,
                isSelected ? { borderColor: themeColor, backgroundColor: softThemeColor } : styles.itemCardInactive,
                !isServiceable ? styles.comingSoonOpacity : null,
              ]}
            >
              <View style={[styles.addressAvatar, { backgroundColor: labelColors[addr.label] || "#F3EEF1" }]}>
                <Text style={{ fontSize: 18 }}>{labelEmojis[addr.label] || "📍"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{addr.label}</Text>
                <Text style={styles.itemMeta} numberOfLines={2}>
                  {addr.house}, {addr.area}
                </Text>
                <Text style={styles.itemMeta}>
                  {addr.city}, {addr.state} - {addr.pincode}
                </Text>
                {!isServiceable && (
                  <Text style={styles.notAvailableText}>Not available yet</Text>
                )}
              </View>
              <View style={[styles.radioCircle, isSelected ? { borderColor: themeColor } : null]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: themeColor }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Add Address CTA / Form */}
      {!showAddressForm ? (
        <Pressable onPress={() => setShowAddressForm(true)} style={[styles.dashedAddBtn, { borderColor: themeColor }]}>
          <Text style={[styles.dashedAddBtnText, { color: themeColor }]}>+ Add New Address</Text>
        </Pressable>
      ) : (
        <View style={styles.inlineForm}>
          {/* Label Type */}
          <View style={styles.typeSelectorRow}>
            {["Home", "Office", "Other"].map(lbl => (
              <Pressable
                key={lbl}
                onPress={() => setNewAddress(prev => ({ ...prev, label: lbl }))}
                style={[
                  styles.labelBtn,
                  newAddress.label === lbl ? { backgroundColor: themeColor, borderColor: themeColor } : null
                ]}
              >
                <Text style={[styles.labelBtnText, newAddress.label === lbl ? styles.labelBtnTextActive : null]}>
                  {lbl}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* State Select */}
          <Text style={styles.formSubtitle}>State</Text>
          <View style={styles.gridContainer}>
            {states.map(state => (
              <Pressable
                key={state.name}
                disabled={!state.active}
                onPress={() => setNewAddress(prev => ({ ...prev, state: state.name, city: "" }))}
                style={[
                  styles.gridBtn,
                  newAddress.state === state.name ? { borderColor: themeColor, backgroundColor: softThemeColor } : null,
                  !state.active ? styles.comingSoonOpacity : null,
                ]}
              >
                <Text style={styles.gridBtnText}>{state.name}</Text>
                {!state.active && <Text style={styles.soonText}>SOON</Text>}
              </Pressable>
            ))}
          </View>

          {/* City Select */}
          {newAddress.state ? (
            <>
              <Text style={styles.formSubtitle}>City</Text>
              <View style={styles.gridContainer}>
                {(cities[newAddress.state] ?? []).map(city => (
                  <Pressable
                    key={city.name}
                    disabled={!city.active}
                    onPress={() => setNewAddress(prev => ({ ...prev, city: city.name }))}
                    style={[
                      styles.gridBtn,
                      newAddress.city === city.name ? { borderColor: themeColor, backgroundColor: softThemeColor } : null,
                      !city.active ? styles.comingSoonOpacity : null,
                    ]}
                  >
                    <Text style={styles.gridBtnText}>{city.name}</Text>
                    {!city.active && <Text style={styles.soonText}>SOON</Text>}
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {newAddress.city ? (
            <View style={styles.listGap}>
              <TextInput
                style={styles.formInput}
                placeholder="House / Flat / Floor"
                placeholderTextColor={Colors.light.textTertiary}
                value={newAddress.house}
                onChangeText={v => setNewAddress(prev => ({ ...prev, house: v }))}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Area / Landmark"
                placeholderTextColor={Colors.light.textTertiary}
                value={newAddress.area}
                onChangeText={v => setNewAddress(prev => ({ ...prev, area: v }))}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Pincode"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="numeric"
                value={newAddress.pincode}
                onChangeText={v => setNewAddress(prev => ({ ...prev, pincode: v }))}
              />
              
              <View style={styles.formActionsRow}>
                <Pressable onPress={() => setShowAddressForm(false)} style={styles.formCancelBtn}>
                  <Text style={styles.formCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={!newAddress.house || !newAddress.area || !newAddress.pincode}
                  onPress={handleSave}
                  style={[
                    styles.formSubmitBtn,
                    { backgroundColor: themeColor },
                    (!newAddress.house || !newAddress.area || !newAddress.pincode) ? styles.formSubmitBtnDisabled : null,
                  ]}
                >
                  <Text style={styles.formSubmitText}>Save Address</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
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
  addressAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  comingSoonOpacity: {
    opacity: 0.5,
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
  notAvailableText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.destructive,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 6,
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
  labelBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  labelBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.bold,
  },
  labelBtnTextActive: {
    color: "#ffffff",
  },
  formSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 6,
    marginBottom: 4,
    fontFamily: Colors.fonts.bold,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 100,
  },
  gridBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  soonText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#b45309",
    marginLeft: 6,
    fontFamily: Colors.fonts.bold,
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
