import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const PHONE_REGEX = /^[6-9]\d{9}$/;

interface ServiceDetailConfig {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  emoji: string;
  accentColor: string;
  softColor: string;
  rating: string | null;
  reviews: string | null;
  priceText: string;
  priceValue?: number;
  isComingSoon: boolean;
  idealFor?: string;
  duration?: string;
}

const serviceDetails: Record<string, ServiceDetailConfig> = {
  grooming: {
    id: "grooming",
    name: "Pet Grooming",
    tagline: "Professional grooming at your doorstep.",
    emoji: "✂️",
    accentColor: "#FF10F0",
    softColor: "#FBF0FB",
    rating: "4.8",
    reviews: "5.1k",
    priceText: "₹499",
    priceValue: 499,
    isComingSoon: false,
    idealFor: "Dogs & Cats",
    duration: "Varies",
  },
  "vet-consultation": {
    id: "vet-consultation",
    name: "Vet Consultation",
    tagline: "Certified vets, any time, any mode",
    emoji: "🩺",
    accentColor: "#1A56DB",
    softColor: "#EFF6FF",
    rating: "4.8",
    reviews: "5.1k",
    priceText: "₹199",
    priceValue: 199,
    isComingSoon: false,
    idealFor: "Dogs & Cats",
    duration: "Varies",
  },
  "pet-food": {
    id: "pet-food",
    name: "Pet Food & Treats",
    tagline: "Vet-approved nutrition delivered fast",
    emoji: "🍖",
    accentColor: "#FFD600",
    softColor: "#FFF9E1",
    rating: "4.7",
    reviews: "1.8k",
    priceText: "₹299",
    priceValue: 299,
    isComingSoon: true,
  },
  "pet-pharma": {
    id: "pet-pharma",
    name: "Canovet Pharma",
    tagline: "Next-Gen Pet Wellness",
    description: "Elevating veterinary care through precision medicine and specialized supplements. Experience a clinical standard that feels like a concierge service.",
    emoji: "💊",
    accentColor: "#10B981",
    softColor: "#D1FAE5",
    rating: null,
    reviews: null,
    priceText: "Concierge Care",
    isComingSoon: true,
  },
  "pet-insurance": {
    id: "pet-insurance",
    name: "Pet Insurance",
    tagline: "Comprehensive coverage, zero worry",
    description: "Protect your best friend with a plan that covers everything from routine checkups to emergency surgeries. Experience professional pet care with cashless claims at top-tier clinics.",
    emoji: "🛡️",
    accentColor: "#6D28D9",
    softColor: "#EDE9FE",
    rating: null,
    reviews: null,
    priceText: "Comprehensive",
    isComingSoon: true,
  },
};

export default function ServiceDetailPage() {
  const { type } = useLocalSearchParams();
  const router = useRouter();

  const resolvedType = useMemo(() => {
    if (!type) return "grooming";
    const t = (type as string).toLowerCase();
    if (t === "grooming") return "grooming";
    if (t === "vet_on_call" || t === "vet-consultation" || t === "vet consultation") return "vet-consultation";
    if (t === "pet-food" || t === "pet_food") return "pet-food";
    if (t === "pet-pharma" || t === "pet_pharma") return "pet-pharma";
    if (t === "pet-insurance" || t === "pet_insurance") return "pet-insurance";
    return "grooming";
  }, [type]);

  const service = serviceDetails[resolvedType] || serviceDetails.grooming;
  const { user } = useAuth();

  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [wantsFaster, setWantsFaster] = useState(false);

  // Redesign States
  const [groomingPlan, setGroomingPlan] = useState<"bath" | "haircut" | "spa" | "nails">("bath");
  const [vetPlan, setVetPlan] = useState<"vet-on-call" | "at-clinic">("vet-on-call");

  const activeGroomingPlanInfo = useMemo(() => {
    const plans = {
      bath: { name: "Bath & Brush", price: 499, duration: "45 min" },
      haircut: { name: "Full Groom", price: 899, duration: "90 min" },
      spa: { name: "Spa Package", price: 1299, duration: "2 hrs" },
      nails: { name: "Nail Trim", price: 199, duration: "20 min" },
    };
    return plans[groomingPlan];
  }, [groomingPlan]);

  const activeVetPlanInfo = useMemo(() => {
    const plans = {
      "vet-on-call": { name: "Vet on Call", price: 199, duration: "30 min", type: "vet-on-call" },
      "at-clinic": { name: "At Clinic", price: 399, duration: "30 min", type: "at-clinic" },
    };
    return plans[vetPlan];
  }, [vetPlan]);

  // Phone no longer on user model; waitlist form is manual entry only

  const handleNotifySubmit = async () => {
    const cleaned = notifyPhone.replace(/\s+/g, "").replace(/^\+91/, "");
    
    if (!cleaned) {
      setNotifyError("Please enter your phone number");
      return;
    }
    if (!PHONE_REGEX.test(cleaned)) {
      setNotifyError("Enter a valid 10-digit mobile number");
      return;
    }

    setNotifyError("");
    setNotifyLoading(true);

    try {
      await api.post("/waitlist", {
        phone: cleaned,
        serviceType: service.id,
        wantsFaster,
      });
      setNotifyLoading(false);
      setNotifySubmitted(true);
      Alert.alert("Success", "You have been added to the early access waitlist!");
    } catch (err: any) {
      setNotifyLoading(false);
      const errMsg = err.response?.data?.error || "Failed to join waitlist. Please try again.";
      setNotifyError(errMsg);
      Alert.alert("Error", errMsg);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backCircle}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{service.name}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderWaitlistForm = () => {
    if (notifySubmitted) {
      return (
        <View style={[styles.successCard, { borderColor: `${service.accentColor}30`, backgroundColor: `${service.accentColor}10` }]}>
          <View style={[styles.successBadge, { backgroundColor: service.accentColor }]}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>You're on the list! 🎉</Text>
          <Text style={styles.successSub}>
            We'll notify you at +91 {notifyPhone} as soon as we launch.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.waitlistContainer}>
        <View style={styles.waitlistCard}>
          <View style={styles.waitlistHeader}>
            <View style={[styles.bellIconBox, { backgroundColor: `${service.accentColor}15` }]}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </View>
            <View>
              <Text style={styles.waitlistTitle}>Get Early Access</Text>
              <Text style={styles.waitlistSub}>Be the first to know when we launch</Text>
            </View>
          </View>

          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="numeric"
              maxLength={10}
              value={notifyPhone}
              onChangeText={(v) => {
                setNotifyPhone(v.replace(/\D/g, ""));
                if (notifyError) setNotifyError("");
              }}
            />
          </View>

          {notifyError ? <Text style={styles.errorText}>⚠️ {notifyError}</Text> : null}

          <Pressable
            onPress={() => setWantsFaster(!wantsFaster)}
            style={styles.checkboxContainer}
          >
            <View style={[styles.checkbox, wantsFaster && { backgroundColor: service.accentColor, borderColor: service.accentColor }]}>
              {wantsFaster ? <Text style={styles.checkboxCheck}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>I want this service faster (Priority Access)</Text>
          </Pressable>

          <Pressable
            disabled={notifyLoading}
            onPress={handleNotifySubmit}
            style={[styles.notifyBtn, { backgroundColor: service.accentColor }]}
          >
            {notifyLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            )}
          </Pressable>
          
          <Text style={styles.waitlistFooterText}>
            We'll send a one-time SMS when this service launches. No spam.
          </Text>
        </View>
      </View>
    );
  };

  const renderGrooming = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#8b008b", "#a7009d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.redesignedHero}
      >
        <View style={styles.customHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSquareBtn}>
            <Text style={styles.headerSquareBtnText}>←</Text>
          </Pressable>
          <Text style={styles.brandLogoText}>cano vet</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.largeIconCard}>
          <Text style={styles.largeIconEmoji}>✂️</Text>
        </View>

        <Text style={styles.redesignedHeroTitle}>Pet Grooming</Text>
        <Text style={styles.redesignedHeroTagline}>Professional grooming at your doorstep.</Text>
        
        <View style={styles.redesignedRatingRow}>
          <Text style={styles.redesignedRatingStar}>★ 4.9</Text>
          <Text style={styles.redesignedRatingReviews}>(3.2k reviews)</Text>
        </View>

        <View style={styles.glassInfoRow}>
          <View style={styles.glassInfoBox}>
            <Text style={styles.glassInfoLabel}>DURATION</Text>
            <Text style={styles.glassInfoValue}>45 min</Text>
          </View>
          <View style={styles.glassInfoBox}>
            <Text style={styles.glassInfoLabel}>FOR</Text>
            <Text style={styles.glassInfoValue}>All Pets</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.redesignedSection}>
        <Text style={styles.redesignedSectionTitle}>Select Grooming Plan</Text>
        <View style={styles.plansList}>
          {[
            { id: "bath", name: "Bath & Brush", price: 499, time: "45 min" },
            { id: "haircut", name: "Full Groom", price: 899, time: "90 min" },
            { id: "spa", name: "Spa Package", price: 1299, time: "2 hrs" },
            { id: "nails", name: "Nail Trim", price: 199, time: "20 min" },
          ].map((plan) => {
            const isSelected = groomingPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setGroomingPlan(plan.id as any)}
                style={[
                  styles.planRadioCard,
                  isSelected && { borderColor: "#a7009d", backgroundColor: "#fdf2f8" }
                ]}
              >
                <View style={styles.planRadioLeft}>
                  <View style={[styles.customRadioOuter, isSelected && { borderColor: "#a7009d" }]}>
                    {isSelected && <View style={styles.customRadioInner} />}
                  </View>
                  <View>
                    <Text style={styles.planCardNameText}>{plan.name}</Text>
                    <Text style={styles.planCardTimeText}>⏱ {plan.time}</Text>
                  </View>
                </View>
                <Text style={styles.planCardPriceText}>₹{plan.price}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.redesignedSection}>
        <Text style={styles.redesignedSectionTitle}>What's Included</Text>
        <View style={styles.checklistCard}>
          {[
            "Full bath with premium natural shampoo",
            "Blow dry & thorough brush out",
            "Breed-specific custom haircut & style",
            "Nail trimming, filing & paw massage",
            "Ear cleaning & eye check",
            "Complimentary styling bow/bandana",
          ].map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <View style={[styles.checklistCircle, { backgroundColor: "#fdf2f8" }]}>
                <Text style={[styles.checkText, { color: "#a7009d" }]}>✓</Text>
              </View>
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderVetConsultation = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#002984", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.redesignedHero}
      >
        <View style={styles.customHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSquareBtn}>
            <Text style={styles.headerSquareBtnText}>←</Text>
          </Pressable>
          <Text style={styles.brandLogoText}>cano vet</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.largeIconCard}>
          <Text style={styles.largeIconEmoji}>❤️</Text>
        </View>

        <Text style={styles.redesignedHeroTitle}>Vet Consultation</Text>
        <Text style={styles.redesignedHeroTagline}>Certified vets, any time, any mode.</Text>
        
        <View style={styles.redesignedRatingRow}>
          <Text style={styles.redesignedRatingStar}>★ 4.8</Text>
          <Text style={styles.redesignedRatingReviews}>(5.1k reviews)</Text>
        </View>

        <View style={styles.glassInfoRow}>
          <View style={styles.glassInfoBox}>
            <Text style={styles.glassInfoLabel}>DURATION</Text>
            <Text style={styles.glassInfoValue}>15-30 min</Text>
          </View>
          <View style={styles.glassInfoBox}>
            <Text style={styles.glassInfoLabel}>FOR</Text>
            <Text style={styles.glassInfoValue}>All Pets</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.redesignedSection}>
        <Text style={styles.redesignedSectionTitle}>Select Consultation Mode</Text>
        <View style={styles.plansList}>
          {[
            { id: "vet-on-call", name: "Vet on Call", price: 199, label: "Expert vet visits your home" },
            { id: "at-clinic", name: "At Clinic", price: 399, label: "Visit partner clinic near you" },
          ].map((plan) => {
            const isSelected = vetPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setVetPlan(plan.id as any)}
                style={[
                  styles.planRadioCard,
                  isSelected && { borderColor: "#1d4ed8", backgroundColor: "#eff6ff" }
                ]}
              >
                <View style={styles.planRadioLeft}>
                  <View style={[styles.customRadioOuter, isSelected && { borderColor: "#1d4ed8" }]}>
                    {isSelected && <View style={[styles.customRadioInner, { backgroundColor: "#1d4ed8" }]} />}
                  </View>
                  <View>
                    <Text style={styles.planCardNameText}>{plan.name}</Text>
                    <Text style={styles.planCardTimeText}>{plan.label}</Text>
                  </View>
                </View>
                <Text style={styles.planCardPriceText}>₹{plan.price}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.redesignedSection}>
        <Text style={styles.redesignedSectionTitle}>What's Included</Text>
        <View style={styles.checklistCard}>
          {[
            "Consultation with certified senior vet",
            "Detailed physical & wellness examination",
            "Digital prescription instantly on app",
            "Dietary & nutritional guidance",
            "Vaccination tracker setup & advice",
            "Free follow-up chat support for 24 hrs",
          ].map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <View style={[styles.checklistCircle, { backgroundColor: "#eff6ff" }]}>
                <Text style={[styles.checkText, { color: "#1d4ed8" }]}>✓</Text>
              </View>
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderPetFood = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[service.softColor, "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.redesignedHero}
      >
        <View style={styles.customHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSquareBtnDark}>
            <Text style={styles.headerSquareBtnTextDark}>←</Text>
          </Pressable>
          <Text style={styles.brandLogoTextDark}>cano vet</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.emojiContainer}>
          <Text style={styles.heroEmoji}>{service.emoji}</Text>
        </View>
        <Text style={styles.heroTitle}>{service.name}</Text>
        <Text style={styles.heroTagline}>{service.tagline}</Text>
        
        <View style={styles.tagRatingRow}>
          <View style={[styles.badgePill, { backgroundColor: service.accentColor }]}>
            <Text style={[styles.badgeText, { color: "#151c27", fontWeight: "800" }]}>AVAILABLE</Text>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★ {service.rating}</Text>
            <Text style={styles.ratingReviews}>({service.reviews}) • From ₹299</Text>
          </View>
        </View>

        <View style={styles.waitlistHeroBtns}>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: service.accentColor }]} onPress={() => Alert.alert("Slots", "Early access booking will be open soon.")}>
            <Text style={styles.waitlistHeroBtnText}>Reserve Your Slot →</Text>
          </Pressable>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: "#ffffff", borderWidth: 1, borderColor: Colors.light.border }]} onPress={() => Alert.alert("Pricing", "Subscription plans starts from ₹299/mo.")}>
            <Text style={[styles.waitlistHeroBtnText, { color: Colors.light.text }]}>View Pricing</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.italicDesc}>
          "Redefining pet nutrition through scientific precision and the highest quality ingredients, ensuring your companion thrives at every stage of life."
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.featuresBox}>
          {[
            "Royal Canin, Pedigree, Hills Science Diet",
            "Purina Pro Plan, Drools, Whiskas",
            "Vet-formulated prescription diets",
            "Natural & organic treat range",
            "Puppy, adult & senior formulas",
            "Free delivery on orders above ₹999",
            "Subscribe & save up to 20%"
          ].map((item, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.greenCheckCircle, { backgroundColor: `${service.accentColor}25` }]}>
                <Text style={[styles.checkMark, { color: "#78350F" }]}>✓</Text>
              </View>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.darkBanner}>
          <Text style={styles.darkBannerTitle}>Subscribe & save up to 20%</Text>
          <Text style={styles.darkBannerText}>Never run out of your pet's favorite food with our hassle-free monthly plan.</Text>
          <Pressable style={[styles.bannerBtn, { backgroundColor: service.accentColor }]} onPress={() => Alert.alert("Waitlist", "Subscriptions will go live in the upcoming release.")}>
            <Text style={styles.bannerBtnText}>Start Subscribing</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        {renderWaitlistForm()}
      </View>
    </ScrollView>
  );

  const renderPharma = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[service.softColor, "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.redesignedHero}
      >
        <View style={styles.customHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSquareBtnDark}>
            <Text style={styles.headerSquareBtnTextDark}>←</Text>
          </Pressable>
          <Text style={styles.brandLogoTextDark}>cano vet</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={[styles.badgePill, { backgroundColor: `${service.accentColor}20`, marginBottom: 12 }]}>
          <Text style={[styles.badgeText, { color: service.accentColor, fontWeight: "700" }]}>AT CLINIC CONCIERGE</Text>
        </View>
        <Text style={styles.heroTitle}>{service.name}</Text>
        <Text style={[styles.heroTagline, { marginTop: 4 }]}>{service.tagline}</Text>
        <Text style={styles.pharmaDesc}>{service.description}</Text>

        <View style={styles.waitlistHeroBtns}>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: service.accentColor }]} onPress={() => Alert.alert("Early Access", "We are opening prescription slots shortly.")}>
            <Text style={[styles.waitlistHeroBtnText, { color: "#ffffff" }]}>Reserve Your Slot →</Text>
          </Pressable>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: "#ffffff", borderWidth: 1, borderColor: Colors.light.border }]} onPress={() => Alert.alert("Pricing", "Clinical pharmacy orders have no markups.")}>
            <Text style={[styles.waitlistHeroBtnText, { color: Colors.light.text }]}>View Pricing</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's Coming</Text>
        
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardEmoji}>💊</Text>
            <Text style={styles.bentoCardTitle}>Prescription Medicines</Text>
          </View>
          <Text style={styles.bentoCardSub}>A curated selection of specialized pharmaceuticals focusing on complex chronic conditions and preventative health for all breeds.</Text>
          <View style={styles.bentoList}>
            {["Chronic condition management", "Dermatology therapeutics", "Cardiology support", "Oncology prescriptions"].map((txt, idx) => (
              <View key={idx} style={styles.bentoListItem}>
                <Text style={{ color: service.accentColor, fontWeight: "800", fontSize: 13 }}>✓</Text>
                <Text style={styles.bentoListText}>{txt}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardEmoji}>💉</Text>
            <Text style={styles.bentoCardTitle}>Vaccines</Text>
          </View>
          <Text style={styles.bentoCardSub}>Ultra-refined vaccine protocols to minimize reactivity while maximizing long-term protection.</Text>
          <View style={[styles.badgePill, { backgroundColor: `${service.accentColor}15`, alignSelf: "flex-start", marginTop: 8 }]}>
            <Text style={[styles.badgeText, { color: service.accentColor }]}>NEXT GEN FORMULA</Text>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardEmoji}>💪</Text>
            <Text style={styles.bentoCardTitle}>Joint Care</Text>
          </View>
          <Text style={styles.bentoCardSub}>Advanced structural support using medical-grade hyaluronic acid and Type-II collagen for senior pets.</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "80%", backgroundColor: service.accentColor }]} />
            </View>
            <Text style={styles.progressText}>80% Development Complete</Text>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardEmoji}>🧬</Text>
            <Text style={styles.bentoCardTitle}>Specialized Supplements</Text>
          </View>
          <Text style={styles.bentoCardSub}>Gut-biome focused nutrition and cognitive support blends formulated by leading clinical researchers.</Text>
        </View>
      </View>

      <View style={styles.section}>
        {renderWaitlistForm()}
      </View>
    </ScrollView>
  );

  const renderInsurance = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[service.softColor, "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.redesignedHero}
      >
        <View style={styles.customHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSquareBtnDark}>
            <Text style={styles.headerSquareBtnTextDark}>←</Text>
          </Pressable>
          <Text style={styles.brandLogoTextDark}>cano vet</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={[styles.badgePill, { backgroundColor: service.accentColor, marginBottom: 12 }]}>
          <Text style={[styles.badgeText, { color: "#ffffff", fontWeight: "700" }]}>NOW ACCEPTING EARLY ACCESS</Text>
        </View>
        <Text style={styles.heroTitle}>{service.name}</Text>
        <Text style={[styles.heroTagline, { marginTop: 4 }]}>{service.tagline}</Text>
        <Text style={styles.pharmaDesc}>{service.description}</Text>

        <View style={styles.waitlistHeroBtns}>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: service.accentColor }]} onPress={() => Alert.alert("Early Access", "Registration slot will open soon.")}>
            <Text style={[styles.waitlistHeroBtnText, { color: "#ffffff" }]}>Reserve Your Slot →</Text>
          </Pressable>
          <Pressable style={[styles.waitlistHeroBtn, { backgroundColor: "#ffffff", borderWidth: 1, borderColor: Colors.light.border }]} onPress={() => Alert.alert("Pricing", "Flexible plans with claims starting soon.")}>
            <Text style={[styles.waitlistHeroBtnText, { color: Colors.light.text }]}>View Pricing</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's Coming</Text>
        <View style={styles.featuresBox}>
          {[
            "Accident & emergency cover",
            "Illness & hospitalisation cover",
            "Routine wellness & vaccination",
            "Surgery & specialist consultations",
            "Third-party liability protection",
            "Cashless claims at 5000+ clinics",
            "No breed or age exclusions"
          ].map((item, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.greenCheckCircle, { backgroundColor: `${service.accentColor}20` }]}>
                <Text style={[styles.checkMark, { color: service.accentColor }]}>✓</Text>
              </View>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        {renderWaitlistForm()}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {resolvedType === "grooming" && renderGrooming()}
      {resolvedType === "vet-consultation" && renderVetConsultation()}
      {resolvedType === "pet-food" && renderPetFood()}
      {resolvedType === "pet-pharma" && renderPharma()}
      {resolvedType === "pet-insurance" && renderInsurance()}

      {resolvedType === "grooming" && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarLabel}>{activeGroomingPlanInfo.name}</Text>
            <Text style={styles.bottomBarPrice}>
              ₹{activeGroomingPlanInfo.price} <Text style={styles.bottomBarUnit}>/session</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/booking/wizard?type=grooming` as any)}
            style={[styles.bookNowBtn, { backgroundColor: "#a7009d" }]}
          >
            <Text style={styles.bookNowBtnText}>Book Now →</Text>
          </Pressable>
        </View>
      )}

      {resolvedType === "vet-consultation" && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarLabel}>{activeVetPlanInfo.name}</Text>
            <Text style={styles.bottomBarPrice}>
              Starts from ₹{activeVetPlanInfo.price}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/booking/wizard?type=${activeVetPlanInfo.type}` as any)}
            style={[styles.bookNowBtn, { backgroundColor: "#1d4ed8" }]}
          >
            <Text style={styles.bookNowBtnText}>Book Now →</Text>
          </Pressable>
        </View>
      )}

      {resolvedType !== "grooming" && resolvedType !== "vet-consultation" && !service.isComingSoon && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarLabel}>Starting from</Text>
            <Text style={styles.bottomBarPrice}>
              {service.priceText} <Text style={styles.bottomBarUnit}>/session</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/booking/wizard?type=${resolvedType}` as any)}
            style={[styles.bookNowBtn, { backgroundColor: service.accentColor }]}
          >
            <Text style={styles.bookNowBtnText}>Book Now →</Text>
          </Pressable>
        </View>
      )}
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  emojiContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
    fontFamily: Colors.fonts.extraBold,
  },
  heroTagline: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    fontFamily: Colors.fonts.medium,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  ratingStar: {
    fontSize: 14,
    fontWeight: "700",
    color: "#eab308",
  },
  ratingReviews: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.regular,
  },
  tagRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  quickInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 12,
    shadowColor: "rgba(0,0,0,0.03)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  quickVal: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: Colors.fonts.extraBold,
  },
  careCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: "rgba(0,0,0,0.02)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  careHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  careIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  careTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  careSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
    lineHeight: 16,
    fontFamily: Colors.fonts.regular,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  careFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 4,
  },
  careFooterItalic: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
    fontFamily: Colors.fonts.regular,
  },
  careFooterPrice: {
    alignItems: "flex-end",
  },
  priceStarts: {
    fontSize: 9,
    color: Colors.light.textTertiary,
  },
  priceValueText: {
    fontSize: 18,
    fontWeight: "900",
  },
  featuresContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 24,
    padding: 16,
  },
  featuresBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greenCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e1a",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "800",
  },
  featureText: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: Colors.fonts.medium,
    flex: 1,
  },
  italicDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  darkBanner: {
    backgroundColor: "#1C0E1A",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  darkBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    fontFamily: Colors.fonts.bold,
  },
  darkBannerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 18,
  },
  bannerBtn: {
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1a0a18",
  },
  waitlistContainer: {
    marginTop: 10,
  },
  waitlistCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  waitlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  waitlistTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  waitlistSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  countryCodeBox: {
    width: 56,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  phoneInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  errorText: {
    color: Colors.light.destructive,
    fontSize: 12,
    fontWeight: "600",
  },
  notifyBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifyBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  waitlistFooterText: {
    fontSize: 10,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 14,
  },
  successCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  successBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successCheck: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
  },
  successSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  waitlistHeroBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    width: "100%",
  },
  waitlistHeroBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  waitlistHeroBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  pharmaDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  bentoCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    padding: 16,
  },
  bentoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  bentoCardEmoji: {
    fontSize: 20,
  },
  bentoCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  bentoCardSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  bentoList: {
    marginTop: 10,
    gap: 6,
  },
  bentoListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bentoListText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  progressBarContainer: {
    marginTop: 12,
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.light.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 14 : 0,
  },
  bottomBarLeft: {
    justifyContent: "center",
  },
  bottomBarLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.light.text,
  },
  bottomBarUnit: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "normal",
  },
  bookNowBtn: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bookNowBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCheck: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  redesignedHero: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  customHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    marginBottom: 20,
  },
  headerSquareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSquareBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  brandLogoText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.extraBold,
  },
  headerSquareBtnDark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(28, 14, 26, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(28, 14, 26, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSquareBtnTextDark: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C0E1A",
  },
  brandLogoTextDark: {
    fontSize: 18,
    color: "#1C0E1A",
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.extraBold,
  },
  largeIconCard: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  largeIconEmoji: {
    fontSize: 38,
  },
  redesignedHeroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: Colors.fonts.extraBold,
  },
  redesignedHeroTagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    fontFamily: Colors.fonts.medium,
  },
  redesignedRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  redesignedRatingStar: {
    fontSize: 14,
    fontWeight: "700",
    color: "#eab308",
  },
  redesignedRatingReviews: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: Colors.fonts.regular,
  },
  glassInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  glassInfoBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  glassInfoLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  glassInfoValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  redesignedSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  redesignedSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: Colors.fonts.bold,
  },
  plansList: {
    gap: 12,
  },
  planRadioCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 20,
    padding: 16,
    shadowColor: "rgba(0,0,0,0.02)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  planRadioLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  customRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a7009d",
  },
  planCardNameText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  planCardTimeText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: Colors.fonts.regular,
  },
  planCardPriceText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  checklistCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "rgba(0,0,0,0.01)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checklistCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 12,
    fontWeight: "900",
  },
  checklistText: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: Colors.fonts.medium,
    flex: 1,
  },
});
