import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/Colors";
import { ApiPet } from "./PetSelector";
import { ServiceItem } from "./ServicePicker";

interface PaymentOptionsProps {
  selectedPets: ApiPet[];
  selectedServices: ServiceItem[];
  paymentMethod: "online" | "offline" | null;
  onSelectPayment: (method: "online" | "offline") => void;
  allowOffline: boolean;
  onConfirm: () => void;
  isCreating: boolean;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  appliedPromo: any;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  isApplyingPromo: boolean;
  promoError: string;
  themeColor?: string;
  softThemeColor?: string;
}

const fi = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI / QR Pay", icon: "⊕", sub: "GPay, PhonePe, Paytm, any UPI" },
  { id: "card", label: "Credit / Debit Card", icon: "◫", sub: "Visa, Mastercard, RuPay" },
  { id: "wal", label: "Digital Wallet", icon: "◉", sub: "PhonePe, Paytm, Amazon Pay" },
  { id: "cod", label: "Cash on Service", icon: "₹", sub: "Pay after service is done" },
];

const UPI_APPS = [
  { name: "GPay", color: "#34A853", letter: "G" },
  { name: "PhonePe", color: "#5F259F", letter: "P" },
  { name: "Paytm", color: "#00B9F1", letter: "T" },
  { name: "BHIM", color: "#00529B", letter: "B" },
];

// Radio Circle Component
function RadioCircle({ on, themeColor = Colors.light.primary }: { on: boolean; themeColor?: string }) {
  return (
    <View style={[radioStyles.outer, on && { borderColor: themeColor }]}>
      {on && <View style={[radioStyles.inner, { backgroundColor: themeColor }]} />}
    </View>
  );
}

const radioStyles = StyleSheet.create({
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default function PaymentOptions({
  selectedPets,
  selectedServices,
  paymentMethod,
  onSelectPayment,
  allowOffline,
  onConfirm,
  isCreating,
  promoCode,
  onPromoCodeChange,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  isApplyingPromo,
  promoError,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: PaymentOptionsProps) {
  const [activeTab, setActiveTab] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const subtotal = selectedPets.reduce((total, pet) => {
    return total + selectedServices.reduce((sub, svc) => {
      return sub + (pet.type === "cat" ? svc.catPrice : svc.dogPrice);
    }, 0);
  }, 0);

  const discount = appliedPromo ? appliedPromo.discount : 0;
  const gst = Math.round((subtotal - discount) * 0.18);
  const finalTotal = appliedPromo ? appliedPromo.total : subtotal + gst;

  const fmtCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 4);
    return n.length >= 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
  };

  // Filter payment methods based on allowOffline
  const methods = allowOffline
    ? PAYMENT_METHODS
    : PAYMENT_METHODS.filter((m) => m.id !== "cod");

  return (
    <View style={{ gap: 14 }}>
      {/* ─── Order Summary Card ─── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>

        {/* Service line items */}
        {selectedPets.map((pet) => (
          <View key={pet.id} style={{ marginBottom: 8 }}>
            <Text style={styles.petLabel}>🐾 {pet.name}</Text>
            {selectedServices.map((svc) => (
              <View key={svc.id} style={styles.lineItemRow}>
                <Text style={styles.lineItemName}>{svc.name}</Text>
                <Text style={styles.lineItemPrice}>
                  {fi(pet.type === "cat" ? svc.catPrice : svc.dogPrice)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.divider} />

        {/* Price breakdown */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Service charge</Text>
          <Text style={styles.priceValue}>{fi(subtotal)}</Text>
        </View>

        {appliedPromo && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: "#1A7A40" }]}>
              Promo {appliedPromo.code} ({appliedPromo.discountPercent || 20}%)
            </Text>
            <Text style={[styles.priceValue, { color: "#1A7A40" }]}>
              -{fi(discount)}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>GST (18%)</Text>
          <Text style={styles.priceValue}>{fi(gst)}</Text>
        </View>

        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fi(finalTotal)}</Text>
        </View>
      </View>

      {/* ─── Apply Coupon Card ─── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Apply Coupon</Text>

        {!appliedPromo ? (
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter promo code"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="characters"
              value={promoCode}
              onChangeText={onPromoCodeChange}
            />
            <Pressable
              disabled={!promoCode.trim() || isApplyingPromo}
              onPress={onApplyPromo}
              style={({ pressed }) => [
                styles.promoApplyBtn,
                { backgroundColor: themeColor },
                (!promoCode.trim() || isApplyingPromo) && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              {isApplyingPromo ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.promoApplyBtnText}>Apply</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.appliedPromoCard, { backgroundColor: softThemeColor, borderColor: themeColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.appliedPromoTitle, { color: themeColor }]}>
                ✓ {appliedPromo.code} Applied
              </Text>
              <Text style={[styles.appliedPromoSub, { color: themeColor }]}>
                🎉 You saved {fi(discount)} with {appliedPromo.code}!
              </Text>
            </View>
            <Pressable onPress={onRemovePromo} style={styles.promoRemoveBtn}>
              <Text style={[styles.promoRemoveText, { color: themeColor }]}>✕</Text>
            </Pressable>
          </View>
        )}
        {promoError ? (
          <Text style={styles.promoErrorText}>{promoError}</Text>
        ) : null}
      </View>

      {/* ─── Payment Method Card ─── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>

        {methods.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              setActiveTab(m.id);
              onSelectPayment(m.id === "cod" ? "offline" : "online");
            }}
            style={styles.methodRow}
          >
            <View
              style={[
                styles.methodIcon,
                activeTab === m.id && { backgroundColor: themeColor },
              ]}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: activeTab === m.id ? "#fff" : Colors.light.textSecondary,
                }}
              >
                {m.icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodName}>{m.label}</Text>
              <Text style={styles.methodSub}>{m.sub}</Text>
            </View>
            <RadioCircle on={activeTab === m.id} themeColor={themeColor} />
          </Pressable>
        ))}

        {/* ─── UPI Details ─── */}
        {activeTab === "upi" && (
          <View style={styles.detailSection}>
            <TextInput
              style={styles.detailInput}
              placeholder="name@bank"
              placeholderTextColor={Colors.light.textTertiary}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.upiAppsRow}>
              {UPI_APPS.map((app) => (
                <Pressable
                  key={app.name}
                  style={styles.upiAppBtn}
                  onPress={() => setUpiId(`user@${app.name.toLowerCase()}`)}
                >
                  <View
                    style={[styles.upiAppCircle, { backgroundColor: app.color }]}
                  >
                    <Text style={styles.upiAppLetter}>{app.letter}</Text>
                  </View>
                  <Text style={styles.upiAppName}>{app.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── Card Details ─── */}
        {activeTab === "card" && (
          <View style={styles.detailSection}>
            {/* Live Card Preview */}
            <LinearGradient
              colors={[Colors.light.primary, "#83007B"] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liveCard}
            >
              <View style={styles.liveCardCircle} />
              <Text style={styles.liveCardNumber}>
                {cardNum || "•••• •••• •••• ••••"}
              </Text>
              <View style={styles.liveCardBottom}>
                <View>
                  <Text style={styles.liveCardLabel}>CARDHOLDER</Text>
                  <Text style={styles.liveCardValue}>
                    {cardName.toUpperCase() || "YOUR NAME"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.liveCardLabel}>EXPIRES</Text>
                  <Text style={styles.liveCardValue}>
                    {cardExp || "MM/YY"}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Card Inputs */}
            <TextInput
              style={[styles.detailInput, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", letterSpacing: 1 }]}
              placeholder="Card number"
              placeholderTextColor={Colors.light.textTertiary}
              value={cardNum}
              onChangeText={(v) => setCardNum(fmtCard(v))}
              maxLength={19}
              keyboardType="numeric"
            />
            <View style={styles.cardInputRow}>
              <TextInput
                style={[styles.detailInput, { flex: 1 }]}
                placeholder="MM/YY"
                placeholderTextColor={Colors.light.textTertiary}
                value={cardExp}
                onChangeText={(v) => setCardExp(fmtExp(v))}
                maxLength={5}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.detailInput, { flex: 1 }]}
                placeholder="CVV"
                placeholderTextColor={Colors.light.textTertiary}
                value={cardCvv}
                onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 3))}
                maxLength={3}
                secureTextEntry
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={styles.detailInput}
              placeholder="Name on card"
              placeholderTextColor={Colors.light.textTertiary}
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="characters"
            />
          </View>
        )}
      </View>

      {/* ─── Pay CTA Button ─── */}
      <Pressable
        disabled={!paymentMethod || isCreating}
        onPress={onConfirm}
        style={({ pressed }) => [
          styles.payBtn,
          { backgroundColor: themeColor, shadowColor: themeColor },
          (!paymentMethod || isCreating) && styles.payBtnDisabled,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        ]}
      >
        <Text style={styles.payBtnText}>
          {isCreating ? "Processing..." : `Pay ${fi(finalTotal)} Securely →`}
        </Text>
      </Pressable>

      {/* ─── Security Badge ─── */}
      <View style={styles.securityRow}>
        <Text style={{ fontSize: 12 }}>🔒</Text>
        <Text style={styles.securityText}>
          256-bit SSL · PCI-DSS compliant · 100% secure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Card Container ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 14,
    fontFamily: Colors.fonts.extraBold,
  },

  // ── Order Summary ──
  petLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
    fontFamily: Colors.fonts.bold,
  },
  lineItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 18,
    marginVertical: 2,
  },
  lineItemName: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.regular,
  },
  lineItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.regular,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  totalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
    fontFamily: Colors.fonts.extraBold,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.light.text,
    fontFamily: Colors.fonts.extraBold,
  },

  // ── Promo Code ──
  promoInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  promoInput: {
    flex: 1,
    height: 46,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.semiBold,
  },
  promoApplyBtn: {
    paddingHorizontal: 18,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  promoApplyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    fontFamily: Colors.fonts.extraBold,
  },
  appliedPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.softPink,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  appliedPromoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.primary,
    fontFamily: Colors.fonts.extraBold,
  },
  appliedPromoSub: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 2,
    fontFamily: Colors.fonts.semiBold,
  },
  promoRemoveBtn: {
    padding: 8,
  },
  promoRemoveText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  promoErrorText: {
    fontSize: 11,
    color: Colors.light.destructive,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: Colors.fonts.medium,
  },

  // ── Payment Methods ──
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconActive: {
    backgroundColor: Colors.light.primary,
  },
  methodName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  methodSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
    fontFamily: Colors.fonts.regular,
  },

  // ── UPI Section ──
  detailSection: {
    marginTop: 14,
    gap: 10,
  },
  detailInput: {
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: "#fff",
    fontFamily: Colors.fonts.regular,
  },
  upiAppsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  upiAppBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#fff",
  },
  upiAppCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  upiAppLetter: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: Colors.fonts.extraBold,
  },
  upiAppName: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.medium,
  },

  // ── Card Section ──
  liveCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 10,
    overflow: "hidden",
  },
  liveCardCircle: {
    position: "absolute",
    right: -28,
    top: -28,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  liveCardNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 18,
  },
  liveCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  liveCardLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 3,
    letterSpacing: 0.8,
    fontFamily: Colors.fonts.medium,
  },
  liveCardValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.bold,
  },
  cardInputRow: {
    flexDirection: "row",
    gap: 10,
  },

  // ── CTA Button ──
  payBtn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    fontFamily: Colors.fonts.extraBold,
  },

  // ── Security ──
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  securityText: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    fontFamily: Colors.fonts.regular,
  },
});
