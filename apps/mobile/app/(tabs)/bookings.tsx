import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingItem = {
  id: string;
  serviceType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  createdAt: string;
  partnerName?: string | null;
  address?: {
    id: string;
    text: string;
    label?: string;
    area?: string;
    city?: string;
  };
  partner?: {
    id: string;
    name: string;
    rating?: number;
    totalCompleted?: number;
  };
  pet?: { name: string; type?: string };
  amount?: number;
};

type TabKey = "upcoming" | "past" | "for_you";

// ─── Brand Colors & Service Icons (Screenshot-based) ────────────────────────

const BRAND_PRIMARY = "#a7009d"; // Screenshot theme color

const SERVICE_THEME: Record<string, {
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  title: string;
}> = {
  VET_CLINIC: {
    badgeLabel: "Clinic",
    badgeBg: "#fdf2f8", // Soft Pink
    badgeText: BRAND_PRIMARY,
    title: "Vet Clinic",
  },
  VET_ON_CALL: {
    badgeLabel: "Vet",
    badgeBg: "#f3eaf8", // Soft Purple
    badgeText: BRAND_PRIMARY,
    title: "Vet On Call",
  },
  GROOMING: {
    badgeLabel: "Grooming",
    badgeBg: "#ffe7f9", // Soft Light Pink
    badgeText: BRAND_PRIMARY,
    title: "Pet Grooming",
  },
};

const DEFAULT_THEME = {
  badgeLabel: "Service",
  badgeBg: "#f3eaf8",
  badgeText: BRAND_PRIMARY,
  title: "Service Appointment",
};

// ─── Status Styles (Screenshot-based) ────────────────────────────────────────

const getStatusTheme = (status: string) => {
  const s = status.toUpperCase();
  if (s === "CONFIRMED" || s === "COMPLETED" || s === "CHECKED_IN" || s === "IN_PROGRESS") {
    return {
      label: s === "IN_PROGRESS" ? "In Progress" : s === "CONFIRMED" ? "Confirmed" : s === "COMPLETED" ? "Completed" : "Checked In",
      bg: "#D1FAE5", // Soft Green
      text: "#065F46",
    };
  }
  if (s === "CANCELLED" || s === "FAILED") {
    return {
      label: s === "CANCELLED" ? "Cancelled" : "Failed",
      bg: "#F3F4F6", // Soft Gray
      text: "#4B5563",
    };
  }
  // Default: Awaiting Payment or Searching Partner
  return {
    label: s === "SEARCHING_PARTNER" ? "Searching Partner" : "Awaiting Payment",
    bg: "#FEF3C7", // Soft Yellow
    text: "#78350F", // Brownish/Dark Yellow
  };
};

// ─── Date & Time Format Helpers ──────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return "-";
  }
};

const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  } catch {
    return "-";
  }
};

const formatSlotTime = (slotStart: string, slotEnd: string) =>
  `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

  const fetchBookings = async () => {
    try {
      const res = await api.get("/booking/history", {
        params: { page: 1, limit: 50 },
      });
      setBookings(res.data?.bookings ?? []);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const { upcoming, completed, cancelled } = useMemo(() => {
    const u: BookingItem[] = [];
    const c: BookingItem[] = [];
    const x: BookingItem[] = [];

    bookings.forEach((b) => {
      if (
        b.status === "CONFIRMED" ||
        b.status === "AWAITING_PAYMENT" ||
        b.status === "IN_PROGRESS" ||
        b.status === "SEARCHING_PARTNER" ||
        b.status === "CHECKED_IN"
      ) {
        u.push(b);
      } else if (b.status === "CANCELLED" || b.status === "FAILED") {
        x.push(b);
      } else {
        c.push(b);
      }
    });

    return { upcoming: u, completed: c, cancelled: x };
  }, [bookings]);

  const activeBookings =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "past"
        ? [...completed, ...cancelled]
        : [];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: completed.length + cancelled.length },
    { key: "for_you", label: "For You", count: 0 },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // ─── Booking Card ─────────────────────────────────────────────────────────

  const renderBookingCard = ({ item, index }: { item: BookingItem; index: number }) => {
    const theme = SERVICE_THEME[item.serviceType] ?? DEFAULT_THEME;
    const statusTheme = getStatusTheme(item.status);
    const isPastCompleted = activeTab === "past" && item.status !== "CANCELLED" && item.status !== "FAILED";
    const isPastCancelled = activeTab === "past" && (item.status === "CANCELLED" || item.status === "FAILED");

    return (
      <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
        <View style={styles.card}>
          {/* Card Header: Service Badge Tag + Title + Right-aligned Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.serviceBadge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.serviceBadgeText, { color: theme.badgeText }]}>
                  {theme.badgeLabel}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{theme.title}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                {statusTheme.label}
              </Text>
            </View>
          </View>

          {/* Details list (Spaced layout below header) */}
          <View style={styles.detailsContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#896f82" />
              <Text style={styles.infoText}>{formatDate(item.slotStart)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#896f82" />
              <Text style={styles.infoText}>{formatSlotTime(item.slotStart, item.slotEnd)}</Text>
            </View>
            {item.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#896f82" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.address.area ? `${item.address.area}, ${item.address.city || "Ahmedabad"}` : item.address.text}
                </Text>
              </View>
            )}
          </View>

          {/* Partner box with soft purple background */}
          {item.partner && (
            <View style={styles.partnerBox}>
              <Text style={styles.partnerName}>{item.partner.name}</Text>
              {item.partner.rating !== undefined && (
                <Text style={styles.partnerSubtitle}>
                  {item.partner.rating} rating · {item.partner.totalCompleted || 280} jobs
                </Text>
              )}
            </View>
          )}

          {/* Card Divider */}
          <View style={styles.cardDivider} />

          {/* Pet Tag in bottom-left */}
          {item.pet && (
            <View style={styles.petBadge}>
              <Text style={styles.petBadgeText}>
                {item.pet.type === "cat" ? "Cat" : "Dog"} {item.pet.name}
              </Text>
            </View>
          )}

          {/* Stacked Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Pressable
              onPress={() => router.push(`/bookings/${item.id}` as any)}
              style={styles.btnGray}
            >
              <Text style={styles.btnGrayText}>View Details</Text>
            </Pressable>

            {activeTab === "upcoming" && (
              <Pressable
                onPress={() => router.push(`/ask-cano?bookingId=${item.id}&intent=feedback` as any)}
                style={styles.btnOutline}
              >
                <Text style={styles.btnOutlineText}>Review or Complain?</Text>
              </Pressable>
            )}

            {isPastCompleted && (
              <>
                <Pressable
                  onPress={() => router.push(`/ask-cano?bookingId=${item.id}&intent=feedback` as any)}
                  style={styles.btnOutline}
                >
                  <Text style={styles.btnOutlineText}>Review or Complain?</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/booking/wizard?type=${item.serviceType.toLowerCase()}` as any
                    )
                  }
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>Rebook Partner →</Text>
                </Pressable>
              </>
            )}

            {isPastCancelled && (
              <Pressable
                onPress={() =>
                  router.push(
                    `/booking/wizard?type=${item.serviceType.toLowerCase()}` as any
                  )
                }
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>Book Again →</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // ─── Empty State ──────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBox}>
        <Ionicons
          name={
            activeTab === "upcoming"
              ? "calendar-outline"
              : activeTab === "past"
                ? "checkmark-circle-outline"
                : "notifications-outline"
          }
          size={40}
          color="#564051"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === "upcoming"
          ? "No upcoming bookings"
          : activeTab === "past"
            ? "No past bookings yet"
            : "No updates for you"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "for_you"
          ? "We'll notify you here about personalized recommendations and care details."
          : "Book a service for your pet to get started."}
      </Text>
    </View>
  );

  // ─── Support Card ─────────────────────────────────────────────────────────

  const renderFooter = () => (
    <View style={styles.supportCard}>
      <View style={styles.supportHeader}>
        <Ionicons name="chatbubbles-outline" size={24} color={BRAND_PRIMARY} />
        <Text style={styles.supportTitle}>Need help with a booking?</Text>
      </View>
      <Text style={styles.supportSubtitle}>
        Our care team is available 24/7 to assist with your appointments.
      </Text>
      <Pressable
        style={styles.supportBtn}
        onPress={() => Linking.openURL("tel:+919876543210")}
      >
        <Text style={styles.supportBtnText}>Contact Support</Text>
      </Pressable>
    </View>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          Track your pet care appointments.
        </Text>
      </View>

      {/* Capsule-Style Tab Selector */}
      <View style={styles.tabOuterContainer}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {tab.key === "for_you" ? (
                    <Text>
                      <Ionicons name="notifications-outline" size={13} /> For You ({tab.count})
                    </Text>
                  ) : (
                    `${tab.label} (${tab.count})`
                  )}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Booking List */}
      <FlatList
        data={activeBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND_PRIMARY}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={activeBookings.length > 0 ? renderFooter : null}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fbf9f8", // Soft Off-White canvas
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fbf9f8",
  },

  // ── Header ──
  header: {
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#fbf9f8", // blending background
  },
  headerTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 28,
    color: "#1b1c1c", // Deep Charcoal
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Colors.fonts.regular,
    fontSize: 14,
    color: "#564051", // Charcoal Gray
  },

  // ── Capsule Tabs Selector ──
  tabOuterContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#efeded", // Gray capsule container
    borderRadius: 999,
    padding: 4,
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff", // Active White Pill
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabText: {
    fontFamily: Colors.fonts.medium,
    fontSize: 12.5,
    color: "#564051", // Muted text for inactive
  },
  tabTextActive: {
    fontFamily: Colors.fonts.bold,
    color: "#1b1c1c", // Dark text for active
  },

  // ── List ──
  list: {
    padding: 24,
    gap: 24, // spacing between cards
    paddingBottom: 100,
  },

  // ── Card ──
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20, // 20px card radius
    padding: 20, // 20px internal padding
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999, // Pill shape
    marginRight: 8,
  },
  serviceBadgeText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 17,
    color: "#1b1c1c",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999, // Pill shape
  },
  statusBadgeText: {
    fontFamily: Colors.fonts.semiBold,
    fontSize: 11,
  },

  // ── Date/Time/Location Details ──
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontFamily: Colors.fonts.regular,
    fontSize: 13.5,
    color: "#4a4a4a",
  },

  // ── Partner Box ──
  partnerBox: {
    backgroundColor: "#fbf0fb", // soft purple/pink bg
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  partnerName: {
    fontFamily: Colors.fonts.bold,
    fontSize: 14,
    color: "#1b1c1c",
  },
  partnerSubtitle: {
    fontFamily: Colors.fonts.regular,
    fontSize: 12,
    color: "#564051",
    marginTop: 3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#efeded",
    marginVertical: 12,
  },

  // ── Pet Badge ──
  petBadge: {
    backgroundColor: "#efeded",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  petBadgeText: {
    fontFamily: Colors.fonts.medium,
    fontSize: 12.5,
    color: "#1b1c1c",
  },

  // ── Action Buttons ──
  actionButtonsContainer: {
    gap: 10,
  },
  btnGray: {
    backgroundColor: "#f4f4f5", // soft gray background
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGrayText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 13.5,
    color: "#1b1c1c",
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BRAND_PRIMARY,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 13.5,
    color: BRAND_PRIMARY,
  },
  btnPrimary: {
    backgroundColor: BRAND_PRIMARY,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 13.5,
    color: "#ffffff",
  },

  // ── Empty State ──
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  emptyTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 17,
    color: "#1b1c1c",
  },
  emptySubtitle: {
    fontFamily: Colors.fonts.regular,
    fontSize: 13.5,
    color: "#564051",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // ── Support Card ──
  supportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#efeded",
    padding: 20,
    marginTop: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#121212",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  supportTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 15.5,
    color: "#1b1c1c",
  },
  supportSubtitle: {
    fontFamily: Colors.fonts.regular,
    fontSize: 13.5,
    color: "#564051",
    lineHeight: 18,
  },
  supportBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  supportBtnText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 12.5,
    color: "#ffffff",
  },
});
