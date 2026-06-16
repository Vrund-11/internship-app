import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_LIST: FAQItem[] = [
  {
    question: "How do I book a care appointment?",
    answer: "You can easily book any pet care service (Grooming, Vet on Call, or Clinic visits) from the home page. Choose the service type, select your pet, pick a convenient date and time slot, confirm the details, and complete payment secure online."
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes. Go to 'My Bookings', select the booking card, and choose 'Reschedule Visit' or 'Cancel Booking'. You can select a new date and time slot directly, or use our Ask Cano virtual assistant for guided support."
  },
  {
    question: "What is the cancellation and refund policy?",
    answer: "Cancellations made 8 hours or more before the scheduled appointment start time are free, and you will receive a 100% refund. Cancellations made within 8 hours of the appointment start time will incur a 20% penalty fee (80% refund)."
  },
  {
    question: "What should I do if the groomer or vet is late?",
    answer: "All service partners are given a 15-minute grace period. If they are delayed beyond that, please contact support so we can track their location or assign an immediate replacement."
  },
  {
    question: "How are the vets and groomers verified?",
    answer: "Every service partner undergoes thorough background checks, professional credentials verification, and hands-on skill training before onboarding. We maintain high rating thresholds to ensure quality care."
  },
  {
    question: "Can I pay offline or in cash?",
    answer: "No, all payments must be processed securely through the app using card, net banking, or UPI. Partners are not authorized to accept cash or offline payments."
  },
  {
    question: "What if the partner demands extra fees or direct cash?",
    answer: "Direct offline payment requests are strictly prohibited. If a partner demands cash or charges extra fees outside the app, do not pay them and contact us immediately via support or email so we can take immediate action."
  },
  {
    question: "What happens if my pet is aggressive or hard to handle?",
    answer: "Please specify your pet's temperament, breed, and weight when adding them to your profile. If your pet is anxious or aggressive, our partners use gentle handling techniques, but you should assist them during the visit for safety."
  },
  {
    question: "How do I add a new pet or address?",
    answer: "You can add pets and addresses directly from your Profile section, from the home screen, or through the conversational prompt in Ask Cano."
  },
  {
    question: "I didn't receive my OTP during login. What should I do?",
    answer: "Please check that you have entered a valid 10-digit mobile number. If the OTP does not arrive within 2 minutes, verify your network connection and click 'Resend OTP'."
  },
  {
    question: "How do I get my pet's medical reports or prescriptions?",
    answer: "After a vet consultation, the digital prescription and medical summary are automatically uploaded and linked to the specific booking. You can view them under 'My Bookings' by selecting the completed appointment."
  },
  {
    question: "Is my payment data safe on the platform?",
    answer: "Yes, all transactions are processed securely through certified payment gateways. We do not store raw card details or banking credentials on our servers."
  },
  {
    question: "Who do I contact in case of a medical emergency?",
    answer: "If your pet needs urgent medical attention, please take them to the nearest animal clinic or emergency hospital immediately. Our services are for scheduled care and are not emergency medical services."
  },
  {
    question: "How do I rate a completed service?",
    answer: "Go to 'My Bookings', switch to 'Past' appointments, and click 'Review or Complain' on the booking card. This will open Ask Cano where you can submit a 1-5 star rating and comment."
  }
];

export default function FAQScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>FAQ & Help</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introEmoji}>❓</Text>
          <Text style={styles.introTitle}>Frequently Asked Questions</Text>
          <Text style={styles.introText}>
            Find quick answers to common questions about appointments, payments, and our grooming & veterinary services.
          </Text>
        </View>

        {/* FAQ List */}
        <View style={styles.listContainer}>
          {FAQ_LIST.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <View key={index} style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
                <Pressable onPress={() => toggleFAQ(index)} style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqChevron}>{isOpen ? "▲" : "▼"}</Text>
                </Pressable>
                {isOpen && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Call to Action at Bottom */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaEmoji}>🚩</Text>
          <Text style={styles.ctaTitle}>Didn't find your related issue?</Text>
          <Text style={styles.ctaText}>
            If you have a specific complaint or need custom support, get in touch with our team.
          </Text>
          <Pressable
            onPress={() => router.push("/ask-cano?intent=complain" as any)}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          >
            <Text style={styles.ctaBtnText}>Contact Ask Cano Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: "#ffffff",
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
    fontFamily: Colors.fonts.bold,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  introContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  introEmoji: {
    fontSize: 32,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    fontFamily: Colors.fonts.extraBold,
    textAlign: "center",
  },
  introText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: Colors.fonts.regular,
    paddingHorizontal: 12,
  },
  listContainer: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(26,10,24,0.03)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  faqCardOpen: {
    borderColor: "rgba(167,0,157,0.15)",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
    lineHeight: 18,
  },
  faqChevron: {
    fontSize: 10,
    color: Colors.light.textTertiary,
  },
  faqAnswerContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    padding: 14,
    backgroundColor: "rgba(26,10,24,0.01)",
  },
  faqAnswer: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.regular,
    lineHeight: 18,
  },
  ctaContainer: {
    backgroundColor: Colors.light.softPink,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,0,157,0.12)",
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  ctaEmoji: {
    fontSize: 24,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  ctaText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    fontFamily: Colors.fonts.regular,
    marginBottom: 8,
  },
  ctaBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  ctaBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: Colors.fonts.bold,
  },
});
