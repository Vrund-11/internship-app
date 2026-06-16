import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { ServiceType } from "@canovet/shared";
import { useBooking } from "@/context/BookingContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";

const { width } = Dimensions.get("window");

type SlotWindow = { slotStart: string; slotEnd: string; available?: boolean };

const SLOT_RANGES: [number, number][] = [
  [10, 12],
  [12, 14],
  [14, 16],
  [16, 18],
];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const buildSlotWindow = (date: Date, s: number, e: number): SlotWindow => {
  const start = new Date(date);
  start.setHours(s, 0, 0, 0);
  const end = new Date(date);
  end.setHours(e, 0, 0, 0);
  return { slotStart: start.toISOString(), slotEnd: end.toISOString() };
};

const getDefaultSlots = (date: Date) =>
  SLOT_RANGES.map(([s, e]) => buildSlotWindow(date, s, e));

const filterPastSlots = (slots: SlotWindow[], date: Date) => {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (!sameDay) return slots;
  return slots.filter((s) => new Date(s.slotEnd).getTime() > now.getTime());
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

type Phase = "schedule" | "searching" | "partner" | "success";

export default function BookingScheduleScreen() {
  const router = useRouter();
  const { booking, setSlot, setAssignment, reset } = useBooking();
  const { city } = useCity();

  const [phase, setPhase] = useState<Phase>("schedule");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotWindow[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [noPartnersNearby, setNoPartnersNearby] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [dotIndex, setDotIndex] = useState(0);

  const [bookingId, setBookingId] = useState<string | null>(null);

  const isClinic = booking.service === ServiceType.VET_CLINIC;
  const minDate = useMemo(
    () => new Date(),
    []
  );

  // Generate next 7 days for date picker
  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(minDate, i));
    }
    return dates;
  }, [minDate]);

  useEffect(() => {
    if (!selectedDate) setSelectedDate(dateOptions[0]);
  }, [dateOptions, selectedDate]);

  // Slot map: label → SlotWindow
  const slotMap = useMemo(() => {
    const m: Record<string, SlotWindow> = {};
    for (const s of slots) {
      m[`${formatTime(s.slotStart)} - ${formatTime(s.slotEnd)}`] = s;
    }
    return m;
  }, [slots]);

  const slotLabels = useMemo(() => Object.keys(slotMap), [slotMap]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !booking.service || !city) return;
    if (isClinic && !booking.clinicId) return;
    if (!isClinic && !booking.addressId) return;

    try {
      setLoadingSlots(true);
      setError("");
      const res = await api.get("/booking/slots", {
        params: {
          date: toDateOnly(selectedDate),
          serviceType: booking.service,
          cityId: city.id,
          ...(isClinic
            ? { clinicId: booking.clinicId }
            : { addressId: booking.addressId }),
        },
      });
      const apiSlots = (res.data.slots ?? []) as SlotWindow[];
      const isNoPartners = Boolean(res.data.noPartnersNearby);
      setNoPartnersNearby(isNoPartners);
      const fallback = getDefaultSlots(selectedDate);
      const next = apiSlots.length > 0 ? apiSlots : fallback;
      setSlots(filterPastSlots(next, selectedDate));
    } catch {
      setSlots(filterPastSlots(getDefaultSlots(selectedDate), selectedDate));
      setNoPartnersNearby(false);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, booking.service, booking.addressId, booking.clinicId, city, isClinic]);

  useEffect(() => {
    fetchSlots();
    setSelectedSlotLabel(null);
    setSlot(null);
  }, [fetchSlots]);

  const handleSelectSlot = (label: string) => {
    const slot = slotMap[label];
    if (slot && slot.available !== false) {
      setSelectedSlotLabel(label);
      setSlot(slot);
    }
  };

  // ── Create Booking ───────────────────────────────────────────────────
  const createBooking = async () => {
    if (!booking.service || !booking.petId || !city) return;
    if (!booking.slotStart || !booking.slotEnd) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/booking", {
        serviceType: booking.service,
        petId: booking.petId,
        addressId: isClinic ? null : booking.addressId,
        clinicId: isClinic ? booking.clinicId : null,
        cityId: city.id,
        slotStart: booking.slotStart,
        slotEnd: booking.slotEnd,
      });

      setAssignment({
        bookingId: res.data.id,
        slotStart: res.data.slotStart,
        slotEnd: res.data.slotEnd,
        status: res.data.status,
        partnerId: res.data.partner?.id ?? null,
        partnerName: res.data.partner?.name ?? null,
      });

      setPartnerName(res.data.partner?.name ?? "Assigned Partner");
      setBookingId(res.data.id);
      setPhase("searching");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Searching animation → success directly
  useEffect(() => {
    if (phase !== "searching") return;
    const timer = setTimeout(() => setPhase("success"), 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "searching") return;
    const timer = setInterval(() => setDotIndex((p) => (p + 1) % 3), 500);
    return () => clearInterval(timer);
  }, [phase]);

  // ── Searching overlay ─────────────────────────────────────────
  if (phase === "searching") {
    return (
      <View style={styles.searchingContainer}>
        <View style={styles.searchingPulse}>
          <View style={styles.searchingIconCircle}>
            <Text style={styles.searchingEmoji}>🐾</Text>
          </View>
        </View>
        <Text style={styles.searchingTitle}>Finding your partner...</Text>
        <Text style={styles.searchingSubtitle}>
          Matching you with the best available vet near you
        </Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                dotIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  // ── Partner assigned ──────────────────────────────────────────
  if (phase === "partner") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <Animated.View entering={ZoomIn.duration(500)} style={styles.partnerCard}>
            <Text style={styles.partnerEmoji}>🐾</Text>
            <Text style={styles.partnerTitle}>Partner Assigned!</Text>
            <Text style={styles.partnerNameText}>{partnerName}</Text>
            <Text style={styles.partnerSubtitle}>
              Certified Pet Care Specialist
            </Text>
            <View style={styles.partnerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>⭐ 4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>25-35</Text>
                <Text style={styles.statLabel}>ETA (min)</Text>
              </View>
            </View>
          </Animated.View>

          <Pressable
            style={styles.successButton}
            onPress={() => setPhase("success")}
          >
            <Text style={styles.successButtonText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Booking success ───────────────────────────────────────────
  if (phase === "success") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <Text style={styles.successEmoji}>🎉</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment has been scheduled successfully.
          </Text>
          <Pressable
            style={[styles.homeButton, { width: "100%", maxWidth: 280 }]}
            onPress={() => {
              const bId = bookingId;
              reset();
              router.replace(`/bookings/${bId}` as any);
            }}
          >
            <Text style={styles.homeButtonText}>View Booking Summary</Text>
          </Pressable>
          <Pressable
            style={[styles.homeButtonSecondary, { width: "100%", maxWidth: 280 }]}
            onPress={() => {
              reset();
              router.replace("/home");
            }}
          >
            <Text style={styles.homeButtonSecondaryText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Schedule selection ────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotDone]} />
          <View style={[styles.stepDot, styles.stepDotDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Picker */}
        <Text style={styles.sectionLabel}>📅 SELECT DATE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {dateOptions.map((date) => {
            const isSelected =
              selectedDate && toDateOnly(date) === toDateOnly(selectedDate);
            const dayName = date.toLocaleDateString("en-IN", {
              weekday: "short",
            });
            const dayNum = date.getDate();
            const month = date.toLocaleDateString("en-IN", { month: "short" });

            return (
              <Pressable
                key={toDateOnly(date)}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dateDayName,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dateDayNum,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {dayNum}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {month}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time Slots */}
        {selectedDate && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              🕐 AVAILABLE SLOTS
            </Text>
            {loadingSlots ? (
              <ActivityIndicator
                color={Colors.light.primary}
                style={{ marginTop: 16 }}
              />
            ) : noPartnersNearby ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  Sorry, no partners available in your area.
                </Text>
              </View>
            ) : slotLabels.length === 0 ? (
              <View style={styles.noSlotsCard}>
                <Text style={styles.noSlotsText}>
                  No slots available for this date. Try another date.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot, index) => {
                  const label = `${formatTime(slot.slotStart)} - ${formatTime(slot.slotEnd)}`;
                  const isSelected = selectedSlotLabel === label;
                  const isAvailable = slot.available !== false;
                  return (
                    <Animated.View
                      key={label}
                      entering={FadeInDown.delay(index * 60).duration(300)}
                    >
                      <Pressable
                        style={[
                          styles.slotCard,
                          isSelected && styles.slotCardSelected,
                          !isAvailable && styles.slotCardDisabled,
                        ]}
                        onPress={() => isAvailable && handleSelectSlot(label)}
                        disabled={!isAvailable}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text
                            style={[
                              styles.slotText,
                              isSelected && styles.slotTextSelected,
                              !isAvailable && styles.slotTextDisabled,
                            ]}
                          >
                            {label}
                          </Text>
                          {!isAvailable && <Text style={{ fontSize: 12 }}>🔒</Text>}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {booking.service === ServiceType.GROOMING && (
          <Text style={styles.noteText}>
            Grooming slots are subject to partner availability.
          </Text>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.continueButton,
            (!selectedSlotLabel || submitting || noPartnersNearby) && styles.buttonDisabled,
          ]}
          onPress={createBooking}
          disabled={!selectedSlotLabel || submitting || noPartnersNearby}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Create Booking</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
  },
  stepIndicator: { flexDirection: "row", gap: 6 },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  stepDotActive: { backgroundColor: Colors.light.primary },
  stepDotDone: { backgroundColor: Colors.light.success },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Date picker
  dateScroll: { gap: 10, paddingRight: 20 },
  dateCard: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
    gap: 2,
  },
  dateCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dateDayName: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  dateDayNum: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  dateTextSelected: { color: "#fff" },

  // Slots
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotCard: {
    width: (width - 60) / 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  slotCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FBF0FB",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  slotTextSelected: { color: Colors.light.primary },
  slotCardDisabled: {
    backgroundColor: "#F3EEF1",
    borderColor: Colors.light.border,
    opacity: 0.5,
  },
  slotTextDisabled: {
    color: "#8A6888",
  },
  noSlotsCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F59E0B30",
  },
  noSlotsText: { fontSize: 13, color: "#B45309" },
  noteText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  errorText: { fontSize: 13, color: "#DC2626" },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  buttonDisabled: { opacity: 0.5 },

  // Searching
  searchingContainer: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  searchingPulse: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  searchingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchingEmoji: { fontSize: 36 },
  searchingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  searchingSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  dotsRow: { flexDirection: "row", gap: 8, marginTop: 24 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: "#fff" },

  // Partner card
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  partnerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  partnerEmoji: { fontSize: 56, marginBottom: 16 },
  partnerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  partnerNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  partnerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  partnerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.border,
  },
  successButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  successButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Success
  successEmoji: { fontSize: 72, marginBottom: 16 },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  homeButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  homeButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  homeButtonSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    marginTop: 12,
  },
  homeButtonSecondaryText: { color: Colors.light.primary, fontSize: 15, fontWeight: "700" },
});
