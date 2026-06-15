import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import Colors from "@/constants/Colors";

interface Partner {
  id?: string;
  name: string;
  phone?: string | null;
}

interface AssignedPartnerCardProps {
  partner: Partner;
  isClinic: boolean;
  onContinue: () => void;
}

export default function AssignedPartnerCard({
  partner,
  isClinic,
  onContinue,
}: AssignedPartnerCardProps) {
  const whatsappNumber = partner.phone ? partner.phone.replace(/\D/g, "") : "";

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>PARTNER ASSIGNED</Text>

      <View style={styles.partnerCard}>
        <View style={styles.partnerHeader}>
          <View style={styles.partnerAvatar}>
            <Text style={{ fontSize: 30 }}>{isClinic ? "🩺" : "✂️"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerSpec}>{isClinic ? "Veterinarian" : "Pet Groomer"}</Text>
            <View style={styles.partnerBadges}>
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>★ 4.8</Text>
              </View>
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>5 yrs exp</Text>
              </View>
              <View style={[styles.partnerBadge, { backgroundColor: "#F5D6F5" }]}>
                <Text style={[styles.partnerBadgeText, { color: Colors.light.primary }]}>ETA 25-35 mins</Text>
              </View>
            </View>
          </View>
        </View>

        {partner.phone ? (
          <View style={styles.contactContainer}>
            <Text style={styles.contactLabel}>Contact Partner</Text>
            <View style={styles.contactRow}>
              <Pressable
                onPress={() => Linking.openURL(`tel:${partner.phone}`)}
                style={styles.contactBtn}
              >
                <View style={styles.contactIconRound}>
                  <Text style={{ fontSize: 16 }}>📞</Text>
                </View>
                <Text style={styles.contactBtnText}>Call</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`sms:${partner.phone}`)}
                style={styles.contactBtn}
              >
                <View style={styles.contactIconRound}>
                  <Text style={{ fontSize: 16 }}>💬</Text>
                </View>
                <Text style={styles.contactBtnText}>SMS</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`https://wa.me/${whatsappNumber}`)}
                style={styles.contactBtn}
              >
                <View style={styles.contactIconRound}>
                  <Text style={{ fontSize: 16 }}>📱</Text>
                </View>
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.noContactCard}>
            <Text style={styles.noContactText}>
              Partner contact details will appear once the booking is fully confirmed.
            </Text>
          </View>
        )}
      </View>

      <Pressable onPress={onContinue} style={styles.summaryBtn}>
        <Text style={styles.summaryBtnText}>View Booking Summary</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 12,
  },
  partnerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EEF1",
    paddingBottom: 16,
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#F5D6F5",
    borderWidth: 1,
    borderColor: "rgba(167, 0, 157, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  partnerSpec: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  partnerBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  partnerBadge: {
    backgroundColor: "#FFF4F0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
  },
  contactContainer: {
    width: "100%",
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "rgba(243, 238, 241, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contactIconRound: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.text,
  },
  noContactCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  noContactText: {
    fontSize: 12,
    color: "#b45309",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  summaryBtn: {
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
