import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { ApiPet } from "./PetSelector";
import { ServiceItem } from "./ServicePicker";
import { useRouter } from "expo-router";

interface SuccessPartner {
  name: string;
  rating: number;
  experience: number;
  specialization: string;
  phone: string | null;
}

interface BookingSuccessOverlayProps {
  booking: {
    pets: ApiPet[];
    services: ServiceItem[];
    address?: any;
    selectedDate?: Date | null;
    selectedTime?: string | null;
    bookingId?: string | null;
  };
  partner: SuccessPartner | null;
  onClose: () => void;
  onViewSummary?: (bookingId: string) => void;
}

export default function BookingSuccessOverlay({
  booking,
  partner,
  onClose,
  onViewSummary,
}: BookingSuccessOverlayProps) {
  const router = useRouter();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateLabel = booking.selectedDate
    ? `${booking.selectedDate.getFullYear()}-${pad(booking.selectedDate.getMonth() + 1)}-${pad(booking.selectedDate.getDate())}`
    : "—";

  const subtotal = booking.pets.reduce((total, pet) => {
    return total + booking.services.reduce((sub, svc) => {
      return sub + (pet.type === "cat" ? svc.catPrice : svc.dogPrice);
    }, 0);
  }, 0);
  const displayTotal = Math.round(subtotal * 1.18); // GST

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={successStyles.container}>
        <ScrollView contentContainerStyle={successStyles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={["#A7009D", "#1A5C3B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={successStyles.header}
          >
            <View style={successStyles.visitBadge}>
              <Text style={successStyles.visitBadgeText}>
                {booking.address?.label === "Clinic" ? "At Clinic" : "Vet on Call"}
              </Text>
            </View>

            <View style={successStyles.checkCircle}>
              <Text style={successStyles.checkMark}>✓</Text>
            </View>

            <Text style={successStyles.title}>Booking Confirmed!</Text>
            <Text style={successStyles.subtitle}>
              {booking.address?.label === "Clinic"
                ? "Your clinic slot is booked."
                : "Your specialist is on the way. Reminder 30 min before arrival."}
            </Text>

            {/* ID Chip */}
            <View style={successStyles.idChip}>
              <Text style={successStyles.idChipLabel}>BOOKING ID</Text>
              <Text style={successStyles.idChipValue}>{booking.bookingId}</Text>
            </View>
          </LinearGradient>

          {/* Details */}
          <View style={successStyles.details}>
            <View style={successStyles.infoCard}>
              <View style={successStyles.infoRow}>
                <Text style={successStyles.infoIcon}>📋</Text>
                <View style={{ flex: 1 }}>
                  <Text style={successStyles.infoLabel}>SERVICE</Text>
                  <Text style={successStyles.infoValue}>
                    {booking.services.map((s) => s.name).join(", ")}
                  </Text>
                </View>
              </View>

              <View style={successStyles.infoRow}>
                <Text style={successStyles.infoIcon}>📅</Text>
                <View>
                  <Text style={successStyles.infoLabel}>DATE & TIME</Text>
                  <Text style={successStyles.infoValue}>
                    {dateLabel} · {booking.selectedTime}
                  </Text>
                </View>
              </View>

              <View style={successStyles.infoRow}>
                <Text style={successStyles.infoIcon}>🐕</Text>
                <View>
                  <Text style={successStyles.infoLabel}>PETS</Text>
                  <Text style={successStyles.infoValue}>
                    {booking.pets.map((p) => p.name).join(", ")}
                  </Text>
                </View>
              </View>

              <View style={successStyles.infoRow}>
                <Text style={successStyles.infoIcon}>💳</Text>
                <View>
                  <Text style={successStyles.infoLabel}>AMOUNT</Text>
                  <Text style={successStyles.infoValue}>₹{displayTotal} (incl. GST)</Text>
                </View>
              </View>
            </View>

            {/* CTAs */}
            <View style={successStyles.actions}>
              <Pressable
                onPress={() => {
                  if (booking.bookingId && onViewSummary) {
                    onViewSummary(booking.bookingId);
                  } else {
                    onClose();
                  }
                }}
                style={[successStyles.btn, successStyles.btnPrimary]}
              >
                <Text style={successStyles.btnPrimaryText}>View Booking Summary</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={[successStyles.btn, successStyles.btnSecondary, { marginTop: 4 }]}
              >
                <Text style={successStyles.btnSecondaryText}>Back to Home</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F8F5",
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  visitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  visitBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#27AE78",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  checkMark: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  idChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  idChipLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
  },
  idChipValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.primary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  details: {
    backgroundColor: "#ffffff",
    padding: 16,
    flex: 1,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    fontSize: 18,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3EEF1",
    textAlign: "center",
    lineHeight: 32,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  partnerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#FBF0FB",
    padding: 12,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE4EB",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  partnerMeta: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  btnSecondaryText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
