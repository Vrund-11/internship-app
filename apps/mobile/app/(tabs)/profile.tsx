import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Pet = {
  id: string;
  name: string;
  type: "dog" | "cat";
  breed: string;
  age: number;
  weight: number;
};

type Address = {
  id: string;
  label: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

// ─── Greeting Helper ─────────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// ─── Accordion Section Component ─────────────────────────────────────────────

type AccordionProps = {
  icon: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  delay?: number;
};

function AccordionSection({ icon, title, children, isOpen, onToggle, delay = 0 }: AccordionProps) {
  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={styles.accordionItem}>
        <Pressable style={styles.accordionHeader} onPress={handleToggle}>
          <View style={styles.accordionHeaderLeft}>
            <View style={styles.accordionIconContainer}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <Text style={styles.accordionTitle}>{title}</Text>
          </View>
          <Text style={styles.accordionChevron}>{isOpen ? "▲" : "▼"}</Text>
        </Pressable>
        {isOpen && (
          <View style={styles.accordionContent}>
            {children}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { city, setCity } = useCity();
  const router = useRouter();

  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get("/booking/pets"), api.get("/booking/addresses")])
      .then(([petsRes, addressesRes]) => {
        const apiPets = (petsRes.data.pets ?? []) as Array<{
          id: string;
          name: string;
          type?: "dog" | "cat";
          breed?: string;
          age?: number;
          weight?: number;
        }>;
        const apiAddresses = (addressesRes.data.addresses ?? []) as Array<{
          id: string;
          text?: string;
          label?: string;
          house?: string;
          area?: string;
          city?: string;
          state?: string;
          pincode?: string;
        }>;

        setPets(
          apiPets.map((pet) => ({
            id: pet.id,
            name: pet.name,
            type: pet.type ?? "dog",
            breed: pet.breed ?? "Mixed",
            age: pet.age ?? 2,
            weight: pet.weight ?? 8,
          }))
        );

        setAddresses(
          apiAddresses.map((addr) => ({
            id: addr.id,
            label: addr.label ?? (addr.text?.startsWith("Clinic") ? "Clinic" : "Home"),
            house: addr.house ?? addr.text ?? "",
            area: addr.area ?? "",
            city: addr.city ?? "Ahmedabad",
            state: addr.state ?? "Gujarat",
            pincode: addr.pincode ?? "000000",
          }))
        );
      })
      .catch(() => {
        setPets([]);
        setAddresses([]);
      });
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setCity(null);
  };

  const handleCancelLogout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLogoutConfirm(false);
  };

  const handleShowLogout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLogoutConfirm(true);
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "G";
  const greeting = getGreeting();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ─── Greeting ─── */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {greeting}, {user?.name || "Pet Parent"} <Text style={{ fontSize: 28 }}>👋</Text>
        </Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || "Pet Parent"}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Text style={{ fontSize: 18 }}>✏️</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* ─── Accordion Sections ─── */}
      <View style={styles.sectionsContainer}>
        {/* Your Pets */}
        <AccordionSection
          icon="🐾"
          title="Your Pets"
          isOpen={openSection === "pets"}
          onToggle={() => toggleSection("pets")}
          delay={100}
        >
          {pets.length === 0 ? (
            <Text style={styles.accordionPlaceholder}>Manage your furry friends here.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {pets.map((pet) => (
                <View key={pet.id} style={styles.petItem}>
                  <Text style={{ fontSize: 22 }}>
                    {pet.type === "dog" ? "🐕" : "🐈"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.petItemName}>{pet.name}</Text>
                    <Text style={styles.petItemInfo}>
                      {pet.breed} · {pet.age} yrs · {pet.weight} kg
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AccordionSection>

        {/* Your Addresses */}
        <AccordionSection
          icon="📍"
          title="Your Addresses"
          isOpen={openSection === "addresses"}
          onToggle={() => toggleSection("addresses")}
          delay={150}
        >
          {addresses.length === 0 ? (
            <Text style={styles.accordionPlaceholder}>Manage your saved locations.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {addresses.map((addr) => (
                <View key={addr.id} style={styles.addressItem}>
                  <View style={styles.addressDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressItemLabel}>{addr.label}</Text>
                    <Text style={styles.addressItemLine}>
                      {addr.house}, {addr.area}
                    </Text>
                    <Text style={styles.addressItemLine}>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AccordionSection>

        {/* Your Bookings */}
        <AccordionSection
          icon="📅"
          title="Your Bookings"
          isOpen={openSection === "bookings"}
          onToggle={() => toggleSection("bookings")}
          delay={200}
        >
          <Pressable
            style={styles.goToBookingsBtn}
            onPress={() => router.push("/(tabs)/bookings" as any)}
          >
            <Text style={styles.goToBookingsBtnText}>View Upcoming Appointments</Text>
            <Text style={{ fontSize: 14 }}>→</Text>
          </Pressable>
        </AccordionSection>

        {/* Coupons */}
        <AccordionSection
          icon="🎟️"
          title="Coupons"
          isOpen={openSection === "coupons"}
          onToggle={() => toggleSection("coupons")}
          delay={250}
        >
          <Text style={styles.accordionPlaceholder}>Check your available rewards.</Text>
        </AccordionSection>
      </View>

      {/* ─── Logout Section ─── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.logoutSection}>
        {!showLogoutConfirm ? (
          <Pressable
            style={styles.logoutBtn}
            onPress={handleShowLogout}
            disabled={isLoggingOut}
          >
            <Text style={{ fontSize: 16 }}>🚪</Text>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </Pressable>
        ) : (
          <View style={styles.logoutConfirm}>
            <Text style={styles.logoutConfirmText}>Are you sure you want to log out?</Text>
            <View style={styles.logoutConfirmBtns}>
              <Pressable
                style={styles.logoutConfirmYes}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutConfirmYesText}>
                  {isLoggingOut ? "Logging out..." : "Confirm"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.logoutConfirmNo}
                onPress={handleCancelLogout}
              >
                <Text style={styles.logoutConfirmNoText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ─── Version ─── */}
      <Text style={styles.versionText}>App Version 1.0.0</Text>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF9F8",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDE4EB",
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F8F4F8",
    borderWidth: 1,
    borderColor: "#EDE4EB",
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
    letterSpacing: 0.3,
  },

  // ── Greeting ──
  greetingSection: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 28,
    fontFamily: Colors.fonts.extraBold,
    color: "#121212",
    lineHeight: 36,
    marginBottom: 20,
  },

  // ── Profile Card ──
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE4EB",
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      },
      android: { elevation: 2 },
    }),
  },
  profileName: {
    fontSize: 20,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
    marginBottom: 6,
    lineHeight: 28,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: Colors.fonts.regular,
    color: "#4A4A4A",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#F8F4F8",
    borderWidth: 1,
    borderColor: "#EDE4EB",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Sections Container ──
  sectionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },

  // ── Accordion ──
  accordionItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE4EB",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      },
      android: { elevation: 2 },
    }),
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accordionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8F4F8",
    justifyContent: "center",
    alignItems: "center",
  },
  accordionTitle: {
    fontSize: 16,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },
  accordionChevron: {
    fontSize: 10,
    color: "#4A4A4A",
  },
  accordionContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#EDE4EB",
    paddingTop: 16,
  },
  accordionPlaceholder: {
    fontSize: 14,
    fontFamily: Colors.fonts.regular,
    color: "#4A4A4A",
  },

  // ── Pet Items ──
  petItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EDE4EB",
  },
  petItemName: {
    fontSize: 15,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },
  petItemInfo: {
    fontSize: 12,
    fontFamily: Colors.fonts.regular,
    color: "#4A4A4A",
    marginTop: 4,
  },

  // ── Address Items ──
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EDE4EB",
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FF10F0",
    marginTop: 6,
  },
  addressItemLabel: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },
  addressItemLine: {
    fontSize: 12,
    fontFamily: Colors.fonts.regular,
    color: "#4A4A4A",
    marginTop: 4,
    lineHeight: 16,
  },

  // ── Go to Bookings ──
  goToBookingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EDE4EB",
  },
  goToBookingsBtnText: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: "#A7009D",
  },

  // ── Logout ──
  logoutSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#121212",
    backgroundColor: "transparent",
  },
  logoutBtnText: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },

  // ── Logout Confirmation ──
  logoutConfirm: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE4EB",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      },
      android: { elevation: 2 },
    }),
    alignItems: "center",
    gap: 16,
  },
  logoutConfirmText: {
    fontSize: 16,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },
  logoutConfirmBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  logoutConfirmYes: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#BA1A1A",
    alignItems: "center",
  },
  logoutConfirmYesText: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: "#FFFFFF",
  },
  logoutConfirmNo: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#121212",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  logoutConfirmNoText: {
    fontSize: 14,
    fontFamily: Colors.fonts.bold,
    color: "#121212",
  },

  // ── Version ──
  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 10,
    fontFamily: Colors.fonts.medium,
    color: "#4A4A4A",
    opacity: 0.5,
    letterSpacing: 0.8,
  },
});
