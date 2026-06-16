import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated as AnimatedRN,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ApiPet {
  id: string;
  name: string;
  type?: "dog" | "cat";
  breed?: string;
  age?: number;
  weight?: number;
}

const PET_EMOJIS: Record<string, string> = { dog: "🐕", cat: "🐈" };

const serviceCategories = [
  {
    id: "GROOMING",
    name: "Pet Grooming",
    tagline: "Spa-level pampering at your doorstep",
    emoji: "✂️",
    accentColor: "#A7009D",
    softColor: "#F5D6F5",
    price: 499,
    tag: null as string | null,
    soon: false,
    isWide: false,
  },
  {
    id: "VET_ON_CALL",
    name: "Vet Consultation",
    tagline: "Certified vets, any time, any mode",
    emoji: "💙",
    accentColor: "#1d4ed8",
    softColor: "#DBEAFE",
    price: 199,
    tag: "Popular",
    soon: false,
    isWide: false,
  },
  {
    id: "pet-food",
    name: "Pet Food & Treats",
    tagline: "Vet-approved nutrition delivered fast",
    emoji: "🍖",
    accentColor: "#b45309",
    softColor: "#FEF3C7",
    price: 299,
    tag: "SOON",
    soon: true,
    isWide: false,
  },
  {
    id: "pet-pharma",
    name: "Canovet Pharma",
    tagline: "Medicines, vaccines & supplements",
    emoji: "💊",
    accentColor: "#059669",
    softColor: "#D1FAE5",
    price: null as number | null,
    tag: "SOON",
    soon: true,
    isWide: false,
  },
  {
    id: "pet-insurance",
    name: "Pet Insurance",
    tagline: "Comprehensive coverage, zero worry",
    emoji: "🛡️",
    accentColor: "#6d28d9",
    softColor: "#EDE9FE",
    price: null as number | null,
    tag: "SOON",
    soon: true,
    isWide: true,
  },
];

const trustBadges = [
  { icon: "✓", label: "Verified Pros", sub: "Background checked", color: "#A7009D", bg: "#FBF0FB" },
  { icon: "★", label: "4.9 Rated", sub: "8.2k+ reviews", color: "#A7009D", bg: "#FBF0FB" },
  { icon: "♡", label: "Pet-Safe Only", sub: "Certified products", color: "#A7009D", bg: "#FBF0FB" },
  { icon: "↻", label: "Redo Promise", sub: "100% satisfaction", color: "#A7009D", bg: "#FBF0FB" },
];

const confettiColors = ["#A7009D", "#CC00BE", "#E040D0", "#F5D6F5", "#A7FFD7", "#FEF3C7", "#DBEAFE", "#D1FAE5"];

const CelebrationModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={celebStyles.overlay} onPress={onClose}>
        <Pressable style={celebStyles.modal} onPress={(e) => e.stopPropagation()}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                celebStyles.confettiDot,
                {
                  left: `${Math.random() * 90}%` as unknown as number,
                  top: Math.random() * 40,
                  backgroundColor: confettiColors[i % confettiColors.length],
                  width: 8 + Math.random() * 4,
                  height: 8 + Math.random() * 4,
                  borderRadius: 2,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                },
              ]}
            />
          ))}

          <Pressable style={celebStyles.closeBtn} onPress={onClose}>
            <Text style={celebStyles.closeBtnText}>✕</Text>
          </Pressable>

          <View style={celebStyles.partyIcon}>
            <Text style={{ fontSize: 36 }}>🎉</Text>
          </View>

          <Text style={celebStyles.title}>🎉 Coupon Claimed!</Text>
          <Text style={celebStyles.subtitle}>
            You've successfully claimed your{" "}
            <Text style={{ fontWeight: "800", color: Colors.light.text }}>20% discount</Text>.
            Apply it at checkout during payment.
          </Text>

          <View style={celebStyles.couponCard}>
            <Text style={celebStyles.couponLabel}>YOUR COUPON CODE</Text>
            <View style={celebStyles.couponCodeRow}>
              <Text style={celebStyles.couponCode}>PAWS20</Text>
              <Pressable style={celebStyles.copyBtn} onPress={handleCopy}>
                <Text style={{ fontSize: 14, color: copied ? "#16a34a" : Colors.light.primary }}>
                  {copied ? "✓✓" : "📋"}
                </Text>
              </Pressable>
            </View>
            {copied && <Text style={celebStyles.copiedText}>✓ Copied to clipboard!</Text>}
          </View>

          <Pressable style={celebStyles.bookNowBtn} onPress={onClose}>
            <Text style={celebStyles.bookNowBtnText}>Book Now & Apply</Text>
            <Text style={{ color: "#fff", fontSize: 16 }}>→</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={celebStyles.laterText}>I'll use it later</Text>
          </Pressable>

          <Text style={celebStyles.validText}>Valid on your first booking • No minimum order</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const AddPetModal = ({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (form: { name: string; type: "dog" | "cat"; breed: string; age: string; weight: string }) => void;
}) => {
  const [form, setForm] = useState({ name: "", type: "dog" as "dog" | "cat", breed: "", age: "2", weight: "8" });
  const [adding, setAdding] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    await onAdd(form);
    setAdding(false);
    setForm({ name: "", type: "dog", breed: "", age: "2", weight: "8" });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={addPetStyles.overlay} onPress={onClose}>
        <Pressable style={addPetStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={addPetStyles.header}>
            <Text style={addPetStyles.headerTitle}>Add Your Pet</Text>
            <Pressable style={addPetStyles.closeBtn} onPress={onClose}>
              <Text style={addPetStyles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={addPetStyles.typeRow}>
            {(["dog", "cat"] as const).map((t) => (
              <Pressable
                key={t}
                style={[
                  addPetStyles.typeBtn,
                  form.type === t && addPetStyles.typeBtnActive,
                ]}
                onPress={() => setForm((f) => ({ ...f, type: t }))}
              >
                <Text style={[addPetStyles.typeBtnText, form.type === t && addPetStyles.typeBtnTextActive]}>
                  {PET_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={addPetStyles.inputs}>
            <TextInput
              style={addPetStyles.input}
              placeholder="Pet name *"
              placeholderTextColor={Colors.light.textTertiary}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              style={addPetStyles.input}
              placeholder="Breed (e.g. Labrador)"
              placeholderTextColor={Colors.light.textTertiary}
              value={form.breed}
              onChangeText={(v) => setForm((f) => ({ ...f, breed: v }))}
            />
            <View style={addPetStyles.row}>
              <TextInput
                style={[addPetStyles.input, { flex: 1 }]}
                placeholder="Age (yrs)"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="numeric"
                value={form.age}
                onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
              />
              <TextInput
                style={[addPetStyles.input, { flex: 1 }]}
                placeholder="Weight (kg)"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="numeric"
                value={form.weight}
                onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              addPetStyles.submitBtnContainer,
              (!form.name.trim() || adding) && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleSubmit}
            disabled={!form.name.trim() || adding}
          >
            <LinearGradient
              colors={["#CC00BE", "#A7009D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={addPetStyles.submitBtnGradient}
            >
              <Text style={addPetStyles.submitBtnText}>{adding ? "Adding..." : "Add Pet"}</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function HomeScreen() {
  const { city } = useCity();
  const { user } = useAuth();
  const router = useRouter();

  const pan = useRef(new AnimatedRN.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: AnimatedRN.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  const [pets, setPets] = useState<ApiPet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activePetIndex, setActivePetIndex] = useState(0);

  const firstName = user?.name ? user.name.split(" ")[0] : "Guest";
  const initials = firstName.charAt(0).toUpperCase();

  const loadPets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/booking/pets");
      const list = (res.data.pets ?? []) as ApiPet[];
      setPets(list);
    } catch {
      setPets([]);
    } finally {
      setPetsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleAddPet = async (form: { name: string; type: "dog" | "cat"; breed: string; age: string; weight: string }) => {
    try {
      const res = await api.post("/booking/pets", {
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || "Mixed",
        age: Number(form.age) || 2,
        weight: Number(form.weight) || 8,
      });
      const created: ApiPet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type || form.type,
        breed: res.data.breed || form.breed || "Mixed",
        age: res.data.age ?? Number(form.age),
        weight: res.data.weight ?? Number(form.weight),
      };
      setPets((prev) => [...prev, created]);
      setActivePetIndex(pets.length);
    } catch {
      const localPet: ApiPet = {
        id: `local-${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || "Mixed",
        age: Number(form.age) || 2,
        weight: Number(form.weight) || 8,
      };
      setPets((prev) => [...prev, localPet]);
      setActivePetIndex(pets.length);
    }
    setShowAddPet(false);
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/service/${serviceId.toLowerCase()}/detail` as any);
  };

  const activePet = pets[activePetIndex] ?? null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      {/* ─── Custom Header / Navbar ─── */}
      <View style={styles.navbar}>
        <View style={styles.navMainRow}>
          <View style={styles.navLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>cano</Text>
              <Text style={{ fontSize: 16, bottom: 1, marginHorizontal: 2 }}>🐾</Text>
              <Text style={styles.brandText}>et</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={{ fontSize: 13 }}>📍</Text>
              <Text style={styles.locationText}>{city?.name ?? "Select City"}</Text>
            </View>
          </View>

          <View style={styles.navActions}>
            <Pressable style={styles.bellBtn}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <View style={styles.bellDot} />
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => router.push("/(tabs)/profile")}>
              <LinearGradient
                colors={Colors.gradients.avatar as [string, string, ...string[]]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {firstName} 👋
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Pet Card Section (only shown when logged in & not guest) ─── */}
        {user && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.section}>
            {!petsLoaded ? (
              <View style={[styles.petCard, styles.skeletonBorder]}>
                <View style={[styles.petAvatar, { backgroundColor: Colors.light.primarySoft }]} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ height: 14, backgroundColor: Colors.light.primarySoft, borderRadius: 6, width: 96 }} />
                  <View style={{ height: 10, backgroundColor: Colors.light.softPink, borderRadius: 6, width: 160 }} />
                </View>
              </View>
            ) : pets.length === 0 ? (
              <Pressable style={styles.petCardEmpty} onPress={() => setShowAddPet(true)}>
                <View style={styles.petAvatarEmpty}>
                  <Text style={{ fontSize: 22, color: Colors.light.primary, fontWeight: "700" }}>+</Text>
                </View>
                <View>
                  <Text style={styles.petCardEmptyTitle}>Add Your Pet</Text>
                  <Text style={styles.petCardEmptySubtitle}>Tap to register your fur baby</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.petCard}>
                <View style={styles.petAvatar}>
                  <Text style={{ fontSize: 28 }}>{PET_EMOJIS[activePet?.type ?? "dog"]}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.petName} numberOfLines={1}>{activePet?.name ?? "Your Pet"}</Text>
                  <Text style={styles.petInfo} numberOfLines={1}>
                    {[activePet?.breed, activePet?.age ? `${activePet.age} yrs` : null, activePet?.weight ? `${activePet.weight} kg` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <View style={styles.petBadgeRow}>
                    <View style={styles.badgeGreen}>
                      <Text style={styles.badgeGreenText}>✓ Vaccinated</Text>
                    </View>
                    {pets.length > 1 && (
                      <View style={styles.badgeYellow}>
                        <Text style={styles.badgeYellowText}>+{pets.length - 1} more</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable style={styles.petAddBtn} onPress={() => setShowAddPet(true)}>
                  <Text style={{ fontSize: 16, color: Colors.light.primary, fontWeight: "800" }}>+</Text>
                </Pressable>
              </View>
            )}

            {pets.length > 1 && (
              <View style={styles.dotsRow}>
                {pets.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActivePetIndex(i)}
                    style={[
                      styles.dot,
                      {
                        width: i === activePetIndex ? 20 : 8,
                        backgroundColor: i === activePetIndex ? Colors.light.primary : Colors.light.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ─── Hero Promo Banner ─── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
          <LinearGradient
            colors={["#A7009D", "#D000C1", "#E54BE1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroPaw}>
              <Text style={{ fontSize: 60, opacity: 0.12 }}>🐾</Text>
            </View>

            <View style={styles.heroBadgeRow}>
              <View style={styles.heroDot} />
              <Text style={styles.heroBadgeText}>INSTANT BOOKING</Text>
            </View>

            <Text style={styles.heroTitle}>
              Need a pet service{"\n"}right now?
            </Text>
            <Text style={styles.heroSubtitle}>
              Grooming, vet & food — book in under 30 seconds
            </Text>

            <Pressable 
              style={({ pressed }) => [
                styles.heroBtn,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }
              ]}
              onPress={() => handleServicePress("VET_ON_CALL")}
            >
              <Text style={styles.heroBtnText}>🐾  Book Now — Instantly  →</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ─── Promo Strip ─── */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <LinearGradient
            colors={["#1a0a18", "#2d0a27"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoStrip}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>First booking 20% off!</Text>
              <Text style={styles.promoSubtitle}>
                Use code <Text style={styles.promoCode}>PAWS20</Text> at checkout
              </Text>
            </View>
            <Pressable style={styles.promoClaimBtn} onPress={() => setShowCelebration(true)}>
              <Text style={styles.promoClaimText}>Claim →</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ─── Services Grid (2 Columns, matching premium mockup) ─── */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>All Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            {serviceCategories.map((svc) => {
              if (svc.isWide) {
                return (
                  <Pressable
                    key={svc.id}
                    style={({ pressed }) => [styles.serviceCardWide, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
                    onPress={() => handleServicePress(svc.id)}
                  >
                    {svc.tag && (
                      <View style={[styles.serviceTag, { position: "absolute", top: 12, right: 12 }]}>
                        <Text style={[styles.serviceTagText, { color: svc.accentColor, backgroundColor: svc.softColor }]}>
                          {svc.tag}
                        </Text>
                      </View>
                    )}
                    <View style={styles.serviceCardWideInner}>
                      <View style={[styles.serviceIconBox, { backgroundColor: svc.softColor }]}>
                        <Text style={{ fontSize: 20, color: svc.accentColor }}>{svc.emoji}</Text>
                      </View>
                      <View>
                        <Text style={styles.serviceCardName}>{svc.name}</Text>
                        <Text style={styles.serviceCardTagline}>{svc.tagline}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={svc.id}
                  style={({ pressed }) => [
                    styles.serviceCard2Col,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => handleServicePress(svc.id)}
                >
                  {svc.tag && (
                    <View style={{ position: "absolute", top: 12, right: 12 }}>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 100,
                          overflow: "hidden",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: svc.accentColor,
                          backgroundColor: svc.softColor,
                        }}
                      >
                        {svc.tag}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.serviceIconBox, { backgroundColor: svc.softColor, marginBottom: 14 }]}>
                    <Text style={{ fontSize: 22, color: svc.accentColor }}>{svc.emoji}</Text>
                  </View>

                  <Text style={styles.serviceCardName}>{svc.name}</Text>
                  <Text style={[styles.serviceCardTagline, { marginBottom: 10 }]} numberOfLines={2}>{svc.tagline}</Text>

                  {!svc.soon && svc.price ? (
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: svc.accentColor, fontFamily: Colors.fonts.extraBold }}>₹{svc.price}</Text>
                      <Text style={{ fontSize: 10, color: Colors.light.textTertiary, fontWeight: "500", fontFamily: Colors.fonts.medium }}> onwards</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: Colors.light.textTertiary, fontStyle: "italic", fontWeight: "500", fontFamily: Colors.fonts.medium }}>
                      Launching soon
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ─── Trust Badges ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={[styles.section, { paddingBottom: 24 }]}>
          <Text style={styles.trustTitle}>Why Canovet 🐾</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trustScroll}
          >
            {trustBadges.map((b) => (
              <View key={b.label} style={styles.trustBadge}>
                <View style={[styles.trustBadgeIcon, { backgroundColor: b.bg }]}>
                  <Text style={{ fontSize: 16, color: b.color }}>{b.icon}</Text>
                </View>
                <Text style={styles.trustBadgeLabel}>{b.label}</Text>
                <Text style={styles.trustBadgeSub}>{b.sub}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── Premium Footer ─── */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerBrand}>cano🐾et</Text>
          <Text style={styles.footerCopyright}>© 2024 Canoet. All rights reserved.</Text>
          <View style={styles.footerLinksRow}>
            <Pressable><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
            <View style={styles.footerLinkDivider} />
            <Pressable><Text style={styles.footerLink}>Terms of Service</Text></Pressable>
            <View style={styles.footerLinkDivider} />
            <Pressable><Text style={styles.footerLink}>Help Center</Text></Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ─── Ask Cano FAB (Draggable / Movable) ─── */}
      <AnimatedRN.View
        style={[
          styles.fabContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => router.push("/ask-cano" as any)}
          style={({ pressed }) => [
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 }
          ]}
        >
          <LinearGradient
            colors={Colors.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          </LinearGradient>
        </Pressable>
      </AnimatedRN.View>

      <CelebrationModal visible={showCelebration} onClose={() => setShowCelebration(false)} />
      <AddPetModal visible={showAddPet} onClose={() => setShowAddPet(false)} onAdd={handleAddPet} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navbar: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navLeft: {
    flexDirection: "column",
    gap: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.light.text,
    letterSpacing: -0.5,
    fontFamily: Colors.fonts.extraBold,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.softPink,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,0,157,0.06)",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    position: "relative",
    zIndex: 10,
  },
  greetingSection: {
    paddingTop: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700",
    fontFamily: Colors.fonts.bold,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    fontFamily: Colors.fonts.extraBold,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  petCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "rgba(26,10,24,0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  skeletonBorder: {
    borderStyle: "solid",
    borderColor: Colors.light.border,
  },
  petCardEmpty: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(167,0,157,0.3)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.softPink,
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.light.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(167,0,157,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  petAvatarEmpty: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(167,0,157,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  petCardEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  petCardEmptySubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  petName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
    fontFamily: Colors.fonts.extraBold,
  },
  petInfo: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: Colors.fonts.regular,
  },
  petBadgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  badgeGreen: {
    backgroundColor: Colors.light.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 100,
  },
  badgeGreenText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.greenText,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  badgeYellow: {
    backgroundColor: Colors.light.yellowBg,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 100,
  },
  badgeYellowText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.yellowText,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  petAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.softPink,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,0,157,0.1)",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroCircle1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroPaw: {
    position: "absolute",
    right: 10,
    bottom: -18,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A7FFD7",
  },
  heroBadgeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: Colors.fonts.bold,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 28,
    marginBottom: 4,
    fontFamily: Colors.fonts.extraBold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: Colors.fonts.regular,
  },
  heroBtn: {
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.light.primary,
    fontFamily: Colors.fonts.extraBold,
  },
  promoStrip: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#1a0a18",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 20,
    fontFamily: Colors.fonts.extraBold,
  },
  promoSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  promoCode: {
    color: "#F5D6F5",
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  promoClaimBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  promoClaimText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  servicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 6,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.3,
    fontFamily: Colors.fonts.extraBold,
  },
  servicesLocation: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.primary,
    fontFamily: Colors.fonts.bold,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceCard2Col: {
    width: (SCREEN_WIDTH - 36 - 12) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  serviceCardWide: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  serviceCardWideInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: Colors.fonts.extraBold,
  },
  serviceCardTagline: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 15,
    fontFamily: Colors.fonts.regular,
  },
  serviceTag: {},
  serviceTagText: {
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trustTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.light.text,
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 6,
    fontFamily: Colors.fonts.extraBold,
  },
  trustScroll: {
    gap: 10,
    paddingRight: 16,
  },
  trustBadge: {
    minWidth: 110,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  trustBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  trustBadgeLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 15,
    fontFamily: Colors.fonts.extraBold,
  },
  trustBadgeSub: {
    fontSize: 10,
    color: Colors.light.textTertiary,
    marginTop: 2,
    lineHeight: 13,
    fontFamily: Colors.fonts.regular,
  },
  fabContainer: {
    position: "absolute",
    bottom: 90,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    width: 60,
    height: 60,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Colors.fonts.extraBold,
  },
  footerContainer: {
    backgroundColor: "#1C0E1A",
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 32,
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Colors.fonts.extraBold,
  },
  footerCopyright: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 24,
    fontFamily: Colors.fonts.regular,
  },
  footerLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    fontFamily: Colors.fonts.semiBold,
  },
  footerLinkDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,10,24,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    overflow: "hidden",
  },
  confettiDot: {
    position: "absolute",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  partyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: Colors.fonts.extraBold,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textTertiary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: Colors.fonts.regular,
  },
  couponCard: {
    backgroundColor: Colors.light.softPink,
    borderRadius: 18,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(167,0,157,0.1)",
  },
  couponLabel: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  couponCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  couponCode: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.light.primary,
    letterSpacing: 3,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(167,0,157,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  copiedText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 8,
  },
  bookNowBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  bookNowBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  laterText: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    fontWeight: "600",
    marginTop: 12,
  },
  validText: {
    fontSize: 11,
    color: "rgba(138,104,136,0.6)",
    marginTop: 16,
  },
});

const addPetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,10,24,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    fontFamily: Colors.fonts.extraBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeBtnActive: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.softPink,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.light.primaryDark,
  },
  inputs: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DDD0DA",
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  submitBtnContainer: {
    height: 52,
    borderRadius: 100,
    overflow: "hidden",
  },
  submitBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
