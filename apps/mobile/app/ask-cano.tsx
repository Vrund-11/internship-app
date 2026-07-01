import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDays, format, isToday } from "date-fns";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { ServiceType } from "@canovet/shared";
import SearchingPartnerOverlay from "@/components/booking/SearchingPartnerOverlay";

type Chip = { label: string; value: string; disabled?: boolean; emoji?: string };

type BotTurn = {
  id: string;
  text: string;
  chips?: Chip[];
  form?: "pet" | "address" | "complaint" | "review";
  answer?: string;
};

type Intent =
  | "idle"
  | "root"
  | "book"
  | "mybookings"
  | "addPet"
  | "addAddress"
  | "rate"
  | "report"
  | "feedback"
  | "help"
  | "cancel"
  | "reschedule"
  | "complain";

type ServiceKey = "grooming" | "vet-on-call" | "at-clinic";

const SERVICE_MAP: Record<ServiceKey, ServiceType> = {
  grooming: ServiceType.GROOMING,
  "vet-on-call": ServiceType.VET_ON_CALL,
  "at-clinic": ServiceType.VET_CLINIC,
};

const SLOT_HOURS = [[10, 12], [12, 14], [14, 16], [16, 18]] as const;

function buildSlots(date: Date) {
  const todayFlag = isToday(date);
  const nowHour = new Date().getHours();
  return SLOT_HOURS
    .filter(([, end]) => !todayFlag || end > nowHour)
    .map(([s, e]) => {
      const start = new Date(date);
      start.setHours(s, 0, 0, 0);
      const end2 = new Date(date);
      end2.setHours(e, 0, 0, 0);
      return {
        label: `${s}:00 – ${e}:00`,
        slotStart: start.toISOString(),
        slotEnd: end2.toISOString(),
      };
    });
}

function dateChips(key: ServiceKey): Chip[] {
  const today = new Date();
  if (key === "vet-on-call") return [{ label: "Today", value: "0", emoji: "📅" }];
  return Array.from({ length: 7 }, (_, i) => ({
    label: i === 0 ? "Tomorrow" : format(addDays(today, i + 1), "EEE, d MMM"),
    value: String(i + 1),
    emoji: i === 0 ? "📅" : undefined,
  }));
}

interface BookCtx {
  bookingId?: string;
  serviceKey?: ServiceKey;
  petId?: string;
  petName?: string;
  variantLabel?: string;
  dateOffset?: number;
  dateLabel?: string;
  slotStart?: string;
  slotEnd?: string;
  slotLabel?: string;
  addressId?: string;
  addressLabel?: string;
}

export default function AskCanoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const intentParam = params.intent as string;
  const bookingIdParam = params.bookingId as string;

  const { city } = useCity();
  const { user } = useAuth();

  const [intent, setIntent] = useState<Intent>("idle");
  const [turns, setTurns] = useState<BotTurn[]>([]);
  const [bookCtx, setBookCtx] = useState<BookCtx>({});
  const [searching, setSearching] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackBookingId, setFeedbackBookingId] = useState<string | null>(bookingIdParam || null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if ((intentParam === "report" || intentParam === "feedback") && bookingIdParam) {
      setFeedbackBookingId(bookingIdParam);
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startContextualFeedback(bookingIdParam), 100);
      return;
    }
    if (intentParam === "complain") {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startComplainFlow(), 100);
      return;
    }
    if (intentParam === "reschedule" && bookingIdParam) {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startContextualReschedule(bookingIdParam), 100);
      return;
    }
    if (intentParam === "feedback") {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startFeedback(), 100);
      return;
    }
    if (intentParam === "help") {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startHelp(), 100);
      return;
    }
    if (intentParam === "rate" && bookingIdParam) {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => {
        setIntent("feedback");
        setFeedbackBookingId(bookingIdParam);
        addBot("⭐ How would you rate your experience with this booking? Please choose 1-5 stars and write a comment below (optional).", undefined, "review");
      }, 100);
      return;
    }
    showRoot();
  }, [intentParam, bookingIdParam]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [turns, loading]);

  const addBot = (text: string, chips?: Chip[], form?: BotTurn["form"]) =>
    setTurns((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        text,
        chips,
        form,
      },
    ]);

  const lock = (answer: string) =>
    setTurns((prev) => {
      const n = [...prev];
      if (n.length) n[n.length - 1] = { ...n[n.length - 1], answer };
      return n;
    });

  const delay = (fn: () => void, ms = 220) => setTimeout(fn, ms);

  const showRoot = () => {
    setIntent("root");
    setBookCtx({});
    setFeedbackBookingId(null);
    const name = user?.name ? user.name.split(" ")[0] : "there";
    setTurns([
      {
        id: "root",
        text: `Hi ${name}! What would you like to do?`,
        chips: [
          { label: "Book a service", value: "book", emoji: "🐾" },
          { label: "My bookings", value: "mybookings", emoji: "📋" },
          { label: "Feedback & Review", value: "feedback", emoji: "⭐" },
          { label: "Help & Support", value: "help", emoji: "❓" },
          { label: "Add a pet", value: "addPet", emoji: "🐶" },
          { label: "Add an address", value: "addAddress", emoji: "🏠" },
        ],
      },
    ]);
  };

  const startOver = () => {
    setTurns([]);
    setIntent("idle");
    setBookCtx({});
    setFeedbackBookingId(null);
    delay(showRoot, 0);
  };

  // ─── Booking Flow ───
  const startBook = () => {
    setIntent("book");
    setBookCtx({});
    delay(() =>
      addBot("Which service would you like to book?", [
        { label: "Pet Grooming", value: "grooming", emoji: "✂️" },
        { label: "Vet on Call (home)", value: "vet-on-call", emoji: "🩺" },
        { label: "At Clinic", value: "at-clinic", emoji: "🏥" },
      ])
    );
  };

  const askPets = async (key: ServiceKey) => {
    setLoading(true);
    try {
      const res = await api.get("/booking/pets");
      const pets: { id: string; name: string; type?: string }[] = res.data.pets ?? [];
      const chips: Chip[] = pets.map((p) => ({
        label: `${p.type === "cat" ? "🐱" : "🐶"} ${p.name}`,
        value: p.id,
      }));
      chips.push({ label: "➕ Add new pet", value: "__add" });
      setBookCtx((c) => ({ ...c, serviceKey: key }));
      addBot(pets.length ? "Which pet is this for?" : "No pets yet. Add one first.", chips);
    } catch {
      addBot("Couldn't load pets. Please try again.", [{ label: "Retry", value: "retry_pets" }]);
    } finally {
      setLoading(false);
    }
  };

  const askVariants = (key: ServiceKey) => {
    const variants: Record<ServiceKey, Chip[]> = {
      grooming: [
        { label: "Bath & Blow Dry · ₹699", value: "bath" },
        { label: "Haircut & Styling · ₹999", value: "haircut" },
        { label: "Full Spa Package · ₹1999", value: "spa" },
        { label: "Nail Trim · ₹299", value: "nails" },
      ],
      "vet-on-call": [
        { label: "General Checkup · ₹599", value: "checkup" },
        { label: "Vaccination · ₹799", value: "vaccination" },
        { label: "Deworming · ₹399", value: "deworming" },
      ],
      "at-clinic": [
        { label: "Clinic Consultation · ₹400", value: "clinic-checkup" },
        { label: "X-Ray · ₹1500", value: "xray" },
        { label: "Blood Test · ₹1200", value: "blood-test" },
      ],
    };
    addBot(`Pick a service option:`, variants[key]);
  };

  const askDates = (key: ServiceKey) => addBot("When would you like to book?", dateChips(key));

  const askSlots = (offset: number) => {
    const date = addDays(new Date(), offset);
    const slots = buildSlots(date);
    if (!slots.length) {
      addBot("No slots available for this date.", [{ label: "Pick another date", value: "retry_date" }]);
      return;
    }
    addBot(
      "Pick a time slot:",
      slots.map((s) => ({ label: s.label, value: `${s.slotStart}|||${s.slotEnd}` }))
    );
  };

  const askAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/booking/addresses");
      const addrs: { id: string; label?: string; area?: string }[] = res.data.addresses ?? [];
      const chips: Chip[] = addrs.map((a) => ({
        label: `${a.label ?? "Home"} · ${a.area ?? ""}`,
        value: a.id,
        emoji: "🏠",
      }));
      chips.push({ label: "➕ Add new address", value: "__add_addr" });
      addBot(addrs.length ? "Where should we come?" : "Add an address to continue.", chips);
    } catch {
      addBot("Couldn't load addresses.", [{ label: "Retry", value: "retry_addr" }]);
    } finally {
      setLoading(false);
    }
  };

  const showSummary = (ctx: BookCtx) => {
    const svc =
      ctx.serviceKey === "grooming"
        ? "Pet Grooming"
        : ctx.serviceKey === "vet-on-call"
        ? "Vet on Call"
        : "At Clinic";
    const summary = `Booking summary:\n• ${svc} – ${ctx.variantLabel}\n• Pet: ${ctx.petName}\n• ${ctx.dateLabel} · ${ctx.slotLabel}\n• ${ctx.addressLabel}`;
    addBot(summary, [
      { label: "✅ Confirm booking", value: "confirm" },
      { label: "🔄 Start over", value: "restart" },
    ]);
  };

  const doConfirm = async (ctx: BookCtx) => {
    if (!ctx.serviceKey || !ctx.petId || !ctx.addressId || !ctx.slotStart || !ctx.slotEnd || !city) {
      addBot("Missing booking details. Please start over.", [{ label: "Start over", value: "restart" }]);
      return;
    }
    lock("Confirmed!");
    setSearching(true);
    try {
      const res = await api.post("/booking", {
        serviceType: SERVICE_MAP[ctx.serviceKey],
        petId: ctx.petId,
        addressId: ctx.addressId,
        cityId: city.id,
        slotStart: ctx.slotStart,
        slotEnd: ctx.slotEnd,
      });
      setConfirmedBookingId(res.data.id);
    } catch {
      setSearching(false);
      addBot("Booking failed. Please try again.", [{ label: "Start over", value: "restart" }]);
    }
  };

  const onPartnerFound = () => {
    setSearching(false);
    addBot(`🎉 Booking confirmed! Your partner is on the way.`, [
      { label: "View my bookings", value: "go_bookings", emoji: "📋" },
      { label: "Back to menu", value: "root", emoji: "🏠" },
    ]);
  };

  // ─── My Bookings ───
  const startMyBookings = async () => {
    setIntent("mybookings");
    setLoading(true);
    try {
      const res = await api.get("/booking/history");
      const bookings: { id: string; serviceType: string; slotStart: string; status: string }[] =
        res.data.bookings ?? [];
      const recent = bookings.slice(0, 5);
      if (!recent.length) {
        addBot("No bookings yet! Book a service to get started.", [
          { label: "Book now", value: "book" },
          { label: "Back", value: "root" },
        ]);
        return;
      }
      addBot(
        "Your recent bookings:",
        recent.map((b) => ({
          label: `${b.serviceType.replace(/_/g, " ")} · ${format(new Date(b.slotStart), "d MMM")}`,
          value: `view:${b.id}`,
          emoji: b.status === "CONFIRMED" ? "🟢" : b.status === "COMPLETED" ? "✅" : "📋",
        }))
      );
    } catch {
      addBot("Couldn't load bookings.", [{ label: "Back", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Feedback & Reviews ───
  const startFeedback = async () => {
    setIntent("feedback");
    setLoading(true);
    try {
      const res = await api.get("/booking/history", { params: { status: "COMPLETED", limit: 20 } });
      const done = (res.data.bookings ?? []).slice(0, 5);
      if (!done.length) {
        addBot("No completed visits to review yet.", [{ label: "Back", value: "root" }]);
        return;
      }
      addBot(
        "Which visit would you like to give feedback on?",
        done.map((b: { id: string; serviceType: string; slotStart: string }) => ({
          label: `${b.serviceType.replace(/_/g, " ")} · ${format(new Date(b.slotStart), "d MMM")}`,
          value: `fb:${b.id}`,
        }))
      );
    } catch {
      addBot("Couldn't load visits.", [{ label: "Back", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  const startContextualFeedback = async (bookingId: string) => {
    setIntent("feedback");
    delay(() => askBookingOptions(bookingId));
  };

  const askBookingOptions = (bookingId: string) => {
    setFeedbackBookingId(bookingId);
    addBot("What would you like to do for this booking?", [
      { label: "⭐ Give a Review", value: `btn_review:::${bookingId}` },
      { label: "🚩 Have an issue with the booking", value: `btn_issue:::${bookingId}` },
    ]);
  };

  const askBookingFaqs = (bookingId: string) => {
    setFeedbackBookingId(bookingId);
    addBot("I can help with that. Here are some common booking issues:", [
      { label: "How to reschedule/cancel?", value: `faq_resch_cancel:::${bookingId}` },
      { label: "Partner delayed/details?", value: `faq_partner_delay:::${bookingId}` },
      { label: "Payment or Refund status?", value: `faq_payment_refund:::${bookingId}` },
      { label: "My issue is not solved yet 🚩", value: `start_complaint:::${bookingId}` },
    ]);
  };

  // ─── Support / Complaints ───
  const startComplainFlow = () => {
    setIntent("complain");
    addBot(
      `✉️ Please email your concern or complaint directly to our team:\n\n` +
        `📧 General: support@canovet.com\n` +
        `📧 Complaints: complaints@canovet.com\n\n` +
        `You can tap any of the buttons below to compose your email directly, or copy our addresses:`,
      [
        { label: "📧 Email Support", value: "extlink:mailto:support@canovet.com" },
        { label: "✍️ Email Complaints", value: "extlink:mailto:complaints@canovet.com" },
        { label: "🏠 Back to menu", value: "root" },
      ]
    );
  };

  const startHelp = () => {
    setIntent("help");
    addBot("How can we help you today?", [
      { label: "📋 Issue with a booking", value: "help_booking" },
      { label: "📱 App / Account issue", value: "help_app" },
      { label: "💳 Payment / Billing", value: "help_payment" },
      { label: "📅 Reschedule a booking", value: "help_reschedule" },
      { label: "📞 Contact support", value: "help_contact" },
    ]);
  };

  const showContactOptions = () => {
    addBot(
      `📞 Contact our support team:\n\n` +
        `📧 Email: support@canovet.com\n` +
        `📧 Complaints: complaints@canovet.com\n` +
        `📱 WhatsApp: +91 99909 79202`
    );
  };

  // ─── Rescheduling ───
  const startRescheduleFlow = async () => {
    setIntent("reschedule");
    setLoading(true);
    try {
      const res = await api.get("/booking/history", { params: { limit: 100 } });
      const bookings: { id: string; serviceType: string; slotStart: string; status: string }[] =
        res.data.bookings ?? [];
      const activeBookings = bookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "AWAITING_PAYMENT"
      );
      if (!activeBookings.length) {
        addBot("You don't have any active bookings that can be rescheduled.", [
          { label: "Back to menu", value: "root" },
        ]);
        return;
      }
      addBot(
        "Which booking would you like to reschedule?",
        activeBookings.map((b) => ({
          label: `${b.serviceType.replace(/_/g, " ")} · ${format(new Date(b.slotStart), "d MMM, h a")}`,
          value: `resched:${b.id}:::${b.serviceType}`,
        }))
      );
    } catch {
      addBot("Couldn't load bookings.", [{ label: "Back", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  const startContextualReschedule = async (bookingId: string) => {
    setIntent("reschedule");
    setLoading(true);
    try {
      const res = await api.get(`/booking/${bookingId}`);
      const booking = res.data;
      setLoading(false);
      askRescheduleDate(booking.id, booking.serviceType);
    } catch {
      setLoading(false);
      addBot("Couldn't load booking details.", [{ label: "Back", value: "root" }]);
    }
  };

  const askRescheduleDate = (bId: string, serviceType: string) => {
    const serviceKey =
      serviceType === "GROOMING"
        ? "grooming"
        : serviceType === "VET_ON_CALL"
        ? "vet-on-call"
        : "at-clinic";

    setBookCtx({
      bookingId: bId,
      serviceKey,
    });

    addBot(
      "Select a new date for rescheduling:",
      dateChips(serviceKey).map((c) => ({
        ...c,
        value: `resched_date:${c.value}`,
      }))
    );
  };

  const askRescheduleSlots = (offset: number) => {
    const date = addDays(new Date(), offset);
    const slots = buildSlots(date);
    if (!slots.length) {
      addBot("No slots available for this date.", [
        { label: "Pick another date", value: `resched_retry_date` },
      ]);
      return;
    }
    addBot(
      "Pick a new time slot:",
      slots.map((s) => ({
        label: s.label,
        value: `resched_slot:${s.slotStart}|||${s.slotEnd}`,
      }))
    );
  };

  const showRescheduleSummary = (ctx: BookCtx) => {
    const summary = `Confirm rescheduling details:\n• New Date: ${ctx.dateLabel}\n• New Slot: ${ctx.slotLabel}`;
    addBot(summary, [
      { label: "✅ Confirm reschedule", value: "resched_confirm" },
      { label: "❌ Cancel", value: "root" },
    ]);
  };

  const doReschedule = async () => {
    if (!bookCtx.bookingId || !bookCtx.slotStart || !bookCtx.slotEnd) {
      addBot("Missing reschedule details. Please start over.", [{ label: "Start over", value: "root" }]);
      return;
    }
    setLoading(true);
    try {
      await api.post(`/booking/${bookCtx.bookingId}/reschedule`, {
        slotStart: bookCtx.slotStart,
        slotEnd: bookCtx.slotEnd,
      });
      addBot("🎉 Booking rescheduled successfully!", [{ label: "Back to menu", value: "root" }]);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Rescheduling failed";
      addBot(`❌ ${msg}`, [
        { label: "Try a different slot", value: `resched_retry_date` },
        { label: "Back to menu", value: "root" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Turn Handlers ───
  const onChip = async (chip: Chip) => {
    const v = chip.value;

    if (v.startsWith("extlink:")) {
      const url = v.slice(8);
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open link"));
      return;
    }

    if (v === "root") {
      lock("Back to menu");
      delay(showRoot);
      return;
    }
    if (v === "restart") {
      lock("Start over");
      delay(startBook);
      return;
    }
    if (v === "book") {
      lock("Book a service");
      delay(startBook);
      return;
    }
    if (v === "mybookings") {
      lock("My bookings");
      delay(startMyBookings);
      return;
    }
    if (v === "addPet") {
      lock("Add a pet");
      setIntent("addPet");
      delay(() => addBot("Tell me about your pet 🐾", undefined, "pet"));
      return;
    }
    if (v === "addAddress") {
      lock("Add an address");
      setIntent("addAddress");
      delay(() => addBot("Add your address:", undefined, "address"));
      return;
    }
    if (v === "feedback") {
      lock("Feedback & Review");
      delay(startFeedback);
      return;
    }
    if (v === "help") {
      lock("Help & Support");
      delay(startHelp);
      return;
    }

    if (v.startsWith("view:")) {
      const id = v.split(":")[1];
      lock("Open booking");
      delay(() => router.push(`/bookings/${id}` as any), 200);
      return;
    }
    if (v.startsWith("go_bookings")) {
      lock("View bookings");
      delay(() => router.push("/(tabs)/bookings" as any), 200);
      return;
    }

    /* ── Feedback chips ── */
    if (v.startsWith("fb:")) {
      const bookingId = v.split(":")[1];
      lock(chip.label);
      delay(() => askBookingOptions(bookingId));
      return;
    }
    if (v.startsWith("btn_review:::")) {
      const bookingId = v.split(":::")[1];
      lock("Give a Review");
      setFeedbackBookingId(bookingId);
      delay(() =>
        addBot(
          "Please select a rating out of 5 stars and add a comment if you like (optional):",
          undefined,
          "review"
        )
      );
      return;
    }
    if (v.startsWith("btn_issue:::")) {
      const bId = v.split(":::")[1];
      lock("Have an issue");
      delay(() => askBookingFaqs(bId));
      return;
    }

    if (v.startsWith("faq_resch_cancel:::")) {
      const bId = v.split(":::")[1];
      lock(chip.label);
      addBot(
        "To reschedule or cancel your booking, you can go to the booking details page and click 'Reschedule' or 'Cancel Booking'. Please note that cancellation charges may apply if done last minute.",
        [
          { label: "Yes, solved! 🐾", value: "root" },
          { label: "No, file a complaint 🚩", value: `start_complaint:::${bId}` },
        ]
      );
      return;
    }
    if (v.startsWith("faq_partner_delay:::")) {
      const bId = v.split(":::")[1];
      lock(chip.label);
      addBot(
        "If your partner is delayed or you cannot reach them, please check their phone number on the booking details page or call our help desk at +91 99909 79202.",
        [
          { label: "Yes, solved! 🐾", value: "root" },
          { label: "No, file a complaint 🚩", value: `start_complaint:::${bId}` },
        ]
      );
      return;
    }
    if (v.startsWith("faq_payment_refund:::")) {
      const bId = v.split(":::")[1];
      lock(chip.label);
      addBot(
        "Refunds are processed automatically to your source account within 5-7 business days for cancelled bookings. If you faced double-deduction, it will be auto-refunded by your bank.",
        [
          { label: "Yes, solved! 🐾", value: "root" },
          { label: "No, file a complaint 🚩", value: `start_complaint:::${bId}` },
        ]
      );
      return;
    }
    if (v.startsWith("start_complaint:::")) {
      const bId = v.split(":::")[1];
      lock("Escalate Issue");
      setIntent("complain");
      setFeedbackBookingId(bId);
      setBookCtx((prev) => ({ ...prev, variantLabel: "BOOKING_ISSUE" }));
      delay(() =>
        addBot(
          "Please describe your issue below so our team can help:",
          undefined,
          "complaint"
        )
      );
      return;
    }

    /* ── Help chips ── */
    if (v === "help_booking") {
      lock("Booking issue");
      delay(startFeedback);
      return;
    }
    if (v === "help_app" || v === "help_payment") {
      lock(chip.label);
      delay(() => addBot("Please describe your issue below so our team can help:", undefined, "complaint"));
      setFeedbackBookingId(null);
      setBookCtx((prev) => ({ ...prev, variantLabel: v === "help_app" ? "APP_ISSUE" : "BILLING" }));
      return;
    }
    if (v === "help_contact") {
      lock("Contact support");
      delay(showContactOptions);
      return;
    }

    /* ── Reschedule chips ── */
    if (v === "help_reschedule") {
      lock("Reschedule a booking");
      delay(startRescheduleFlow);
      return;
    }
    if (v.startsWith("resched:")) {
      const parts = v.split(":::");
      const bId = parts[0].split(":")[1];
      const serviceType = parts[1];
      lock(chip.label);
      delay(() => askRescheduleDate(bId, serviceType));
      return;
    }
    if (v.startsWith("resched_date:")) {
      const offset = Number(v.split(":")[1]);
      lock(chip.label);
      setBookCtx((c) => ({ ...c, dateOffset: offset, dateLabel: chip.label }));
      delay(() => askRescheduleSlots(offset));
      return;
    }
    if (v === "resched_retry_date") {
      lock("Pick another date");
      delay(() => {
        addBot(
          "Select a new date for rescheduling:",
          dateChips(bookCtx.serviceKey!).map((c) => ({
            ...c,
            value: `resched_date:${c.value}`,
          }))
        );
      });
      return;
    }
    if (v.startsWith("resched_slot:")) {
      const rawSlot = v.split(":")[1];
      const [ss, se] = rawSlot.split("|||");
      lock(chip.label);
      setBookCtx((c) => {
        const updated = { ...c, slotStart: ss, slotEnd: se, slotLabel: chip.label };
        delay(() => showRescheduleSummary(updated));
        return updated;
      });
      return;
    }
    if (v === "resched_confirm") {
      lock("Confirming reschedule...");
      delay(doReschedule);
      return;
    }

    /* ── Booking chips ── */
    if (intent === "book") {
      if (["grooming", "vet-on-call", "at-clinic"].includes(v) && !bookCtx.serviceKey) {
        lock(chip.label);
        delay(() => askPets(v as ServiceKey));
        return;
      }
      if (!bookCtx.petId) {
        if (v === "__add") {
          lock("Add new pet");
          delay(() => addBot("Tell me about your pet 🐾", undefined, "pet"));
          return;
        }
        lock(chip.label);
        setBookCtx((c) => ({ ...c, petId: v, petName: chip.label.replace(/^[🐶🐱]\s/, "") }));
        delay(() => askVariants(bookCtx.serviceKey!));
        return;
      }
      if (!bookCtx.variantLabel) {
        lock(chip.label);
        setBookCtx((c) => ({ ...c, variantLabel: chip.label }));
        delay(() => askDates(bookCtx.serviceKey!));
        return;
      }
      if (bookCtx.dateOffset === undefined) {
        lock(chip.label);
        const offset = Number(v);
        setBookCtx((c) => ({ ...c, dateOffset: offset, dateLabel: chip.label }));
        delay(() => askSlots(offset));
        return;
      }
      if (!bookCtx.slotStart) {
        lock(chip.label);
        const [ss, se] = v.split("|||");
        setBookCtx((c) => ({ ...c, slotStart: ss, slotEnd: se, slotLabel: chip.label }));
        if (bookCtx.serviceKey === "at-clinic") {
          delay(() =>
            addBot("At-clinic visits need to be booked in person. Please call us.", [
              { label: "Back to menu", value: "root" },
            ])
          );
        } else {
          delay(askAddresses);
        }
        return;
      }
      if (!bookCtx.addressId) {
        if (v === "__add_addr") {
          lock("Add new address");
          delay(() => addBot("Add your address:", undefined, "address"));
          return;
        }
        lock(chip.label);
        const updatedCtx = { ...bookCtx, addressId: v, addressLabel: chip.label };
        setBookCtx(updatedCtx);
        delay(() => showSummary(updatedCtx));
        return;
      }
      if (v === "confirm") {
        doConfirm(bookCtx);
        return;
      }
      if (v === "retry_pets") {
        delay(() => askPets(bookCtx.serviceKey!));
        return;
      }
      if (v === "retry_addr") {
        delay(askAddresses);
        return;
      }
      if (v === "retry_date") {
        delay(() => askDates(bookCtx.serviceKey!));
        return;
      }
    }
  };

  const handlePetSubmit = async (
    name: string,
    type: string,
    breed: string,
    age: string,
    weight: string
  ) => {
    try {
      setLoading(true);
      const res = await api.post("/booking/pets", {
        name,
        type,
        breed,
        age: Number(age),
        weight: Number(weight),
      });
      const pet = res.data.pet ?? res.data;
      lock(`${type === "cat" ? "🐱" : "🐶"} ${name} added`);
      setLoading(false);
      if (intent === "book" && bookCtx.serviceKey) {
        setBookCtx((c) => ({ ...c, petId: pet.id, petName: name }));
        delay(() => askVariants(bookCtx.serviceKey!));
      } else {
        delay(() =>
          addBot(`${name} is added! 🐾`, [
            { label: "Book now", value: "book" },
            { label: "Back to menu", value: "root" },
          ])
        );
      }
    } catch {
      setLoading(false);
      addBot("Failed to save pet. Please try again.", [{ label: "Back", value: "root" }]);
    }
  };

  const handleAddressSubmit = async (label: string, area: string, city2: string, pincode: string) => {
    try {
      setLoading(true);
      const res = await api.post("/booking/addresses", { label, area, city: city2, pincode, house: area });
      const addr = res.data.address ?? res.data;
      lock(`${label} added`);
      setLoading(false);
      if (intent === "book" && bookCtx.slotStart) {
        const updatedCtx = { ...bookCtx, addressId: addr.id, addressLabel: `${label} · ${area}` };
        setBookCtx(updatedCtx);
        delay(() => showSummary(updatedCtx));
      } else {
        delay(() =>
          addBot("Address saved! 🏠", [
            { label: "Book a service", value: "book" },
            { label: "Back to menu", value: "root" },
          ])
        );
      }
    } catch {
      setLoading(false);
      addBot("Failed to save address.", [{ label: "Back", value: "root" }]);
    }
  };

  const handleComplaintSubmit = async (phone: string, whatsapp: string, message: string) => {
    try {
      setLoading(true);
      lock("Submitted report details");
      const category = bookCtx.variantLabel || "OTHER";
      const res = await api.post("/complaint", {
        bookingId: feedbackBookingId || undefined,
        message,
        phone,
        whatsapp,
        category,
      });

      const priority = res.data?.priority ?? "LOW";

      if (priority === "HIGH") {
        addBot(
          "🚨 This has been escalated to our emergency response team. We will contact you within 2 hours on your provided phone/WhatsApp.",
          [
            { label: "📧 Email Support", value: "extlink:mailto:support@canovet.com" },
            { label: "✍️ Email Complaints", value: "extlink:mailto:complaints@canovet.com" },
            { label: "🏠 Back to menu", value: "root" },
          ]
        );
      } else {
        addBot(
          "✅ Your report has been registered. Our team will review it and contact you within 24 hours. Thank you for your patience. 🙏",
          [
            { label: "📧 Email Support", value: "extlink:mailto:support@canovet.com" },
            { label: "✍️ Email Complaints", value: "extlink:mailto:complaints@canovet.com" },
            { label: "🏠 Back to menu", value: "root" },
          ]
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit. Please try again.";
      addBot(`❌ ${msg}`, [{ label: "Back to menu", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      setLoading(true);
      lock(`Submitted: ${rating}/5 stars`);
      await api.post("/review", {
        bookingId: feedbackBookingId,
        rating,
        comment: comment || undefined,
      });
      delay(() =>
        addBot("Thank you! Your review has been recorded. 🐾", [{ label: "Back to menu", value: "root" }])
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to submit review";
      delay(() => addBot(`❌ ${msg}`, [{ label: "Back to menu", value: "root" }]));
    } finally {
      setLoading(false);
    }
  };

  if (searching) {
    return <SearchingPartnerOverlay onFound={onPartnerFound} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ask Cano Assistant</Text>
        <View style={{ width: 56 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {turns.map((turn, i) => (
            <TurnView
              key={turn.id}
              turn={turn}
              isLast={i === turns.length - 1}
              onChip={onChip}
              onPetSubmit={handlePetSubmit}
              onAddressSubmit={handleAddressSubmit}
              onComplaintSubmit={handleComplaintSubmit}
              onReviewSubmit={handleReviewSubmit}
              disabled={loading}
              userPhone={undefined}
            />
          ))}

          {loading && (
            <View style={styles.loaderBubble}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start Over Button in Footer */}
      <View style={styles.footer}>
        <Pressable onPress={startOver} style={styles.startOverBtn}>
          <Text style={styles.startOverBtnText}>↺ Start over</Text>
        </Pressable>
        <Text style={styles.footerLabel}>Select an option above</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── TurnView Component ───
function TurnView({
  turn,
  isLast,
  onChip,
  onPetSubmit,
  onAddressSubmit,
  onComplaintSubmit,
  onReviewSubmit,
  disabled,
  userPhone,
}: {
  turn: BotTurn;
  isLast: boolean;
  onChip: (c: Chip) => void;
  onPetSubmit: (name: string, type: string, breed: string, age: string, weight: string) => void;
  onAddressSubmit: (label: string, area: string, city: string, pincode: string) => void;
  onComplaintSubmit: (phone: string, whatsapp: string, message: string) => void;
  onReviewSubmit: (rating: number, comment: string) => void;
  disabled?: boolean;
  userPhone?: string;
}) {
  const locked = !!turn.answer;

  return (
    <View style={styles.turnContainer}>
      {/* Bot Bubble */}
      <View style={styles.botRow}>
        <View style={styles.botBubble}>
          <Text style={styles.botText}>{turn.text}</Text>
        </View>
      </View>

      {/* Bot Chips */}
      {!locked && turn.chips && (
        <View style={[styles.chipsContainer, disabled && { opacity: 0.5 }]}>
          {turn.chips.map((c) => (
            <Pressable
              key={c.value}
              disabled={disabled}
              onPress={() => onChip(c)}
              style={({ pressed }) => [styles.chipBtn, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              {c.emoji && <Text style={{ marginRight: 4 }}>{c.emoji}</Text>}
              <Text style={styles.chipText}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Inline Forms */}
      {!locked && turn.form === "pet" && isLast && <PetForm onSubmit={onPetSubmit} />}
      {!locked && turn.form === "address" && isLast && <AddressForm onSubmit={onAddressSubmit} />}
      {!locked && turn.form === "complaint" && isLast && (
        <ComplaintForm onSubmit={onComplaintSubmit} userPhone={userPhone} />
      )}
      {!locked && turn.form === "review" && isLast && <ReviewForm onSubmit={onReviewSubmit} />}

      {/* User Bubble (Locked Answer) */}
      {locked && (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{turn.answer}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Inline Form Components ───

function PetForm({
  onSubmit,
}: {
  onSubmit: (name: string, type: string, breed: string, age: string, weight: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const ok = name.trim() && breed.trim() && age && weight;

  const handleSave = async () => {
    setSaving(true);
    await onSubmit(name.trim(), type, breed.trim(), age, weight);
    setSaving(false);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>🐾 Pet Details</Text>
      <TextInput
        placeholder="Pet name"
        placeholderTextColor={Colors.light.textTertiary}
        value={name}
        onChangeText={setName}
        style={styles.formInput}
        editable={!saving}
      />
      <View style={styles.tabRow}>
        {["dog", "cat"].map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            disabled={saving}
            style={[styles.tabBtn, type === t ? styles.tabBtnActive : styles.tabBtnInactive]}
          >
            <Text style={[styles.tabText, type === t ? styles.tabTextActive : styles.tabTextInactive]}>
              {t === "dog" ? "🐶 Dog" : "🐱 Cat"}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="Breed"
        placeholderTextColor={Colors.light.textTertiary}
        value={breed}
        onChangeText={breed => setBreed(breed)}
        style={styles.formInput}
        editable={!saving}
      />
      <View style={styles.formRow}>
        <TextInput
          placeholder="Age (yrs)"
          placeholderTextColor={Colors.light.textTertiary}
          keyboardType="numeric"
          value={age}
          onChangeText={age => setAge(age)}
          style={[styles.formInput, { flex: 1 }]}
          editable={!saving}
        />
        <TextInput
          placeholder="Weight (kg)"
          placeholderTextColor={Colors.light.textTertiary}
          keyboardType="numeric"
          value={weight}
          onChangeText={weight => setWeight(weight)}
          style={[styles.formInput, { flex: 1 }]}
          editable={!saving}
        />
      </View>
      <Pressable
        disabled={!ok || saving}
        onPress={handleSave}
        style={[styles.formSubmitBtn, !ok && { opacity: 0.5 }]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.formSubmitText}>Save Pet</Text>
        )}
      </Pressable>
    </View>
  );
}

function AddressForm({
  onSubmit,
}: {
  onSubmit: (label: string, area: string, city: string, pincode: string) => void;
}) {
  const [label, setLabel] = useState("Home");
  const [area, setArea] = useState("");
  const [city2, setCity2] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);

  const ok = area.trim() && city2.trim() && pincode.length >= 6;

  const handleSave = async () => {
    setSaving(true);
    await onSubmit(label, area.trim(), city2.trim(), pincode);
    setSaving(false);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>🏠 Address Details</Text>
      <View style={styles.tabRow}>
        {["Home", "Work", "Other"].map((l) => (
          <Pressable
            key={l}
            onPress={() => setLabel(l)}
            disabled={saving}
            style={[styles.tabBtn, label === l ? styles.tabBtnActive : styles.tabBtnInactive]}
          >
            <Text style={[styles.tabText, label === l ? styles.tabTextActive : styles.tabTextInactive]}>
              {l}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="Area / Locality"
        placeholderTextColor={Colors.light.textTertiary}
        value={area}
        onChangeText={area => setArea(area)}
        style={styles.formInput}
        editable={!saving}
      />
      <TextInput
        placeholder="City"
        placeholderTextColor={Colors.light.textTertiary}
        value={city2}
        onChangeText={city => setCity2(city)}
        style={styles.formInput}
        editable={!saving}
      />
      <TextInput
        placeholder="Pincode (6 digits)"
        placeholderTextColor={Colors.light.textTertiary}
        keyboardType="numeric"
        maxLength={6}
        value={pincode}
        onChangeText={pincode => setPincode(pincode.replace(/\D/g, ""))}
        style={styles.formInput}
        editable={!saving}
      />
      <Pressable
        disabled={!ok || saving}
        onPress={handleSave}
        style={[styles.formSubmitBtn, !ok && { opacity: 0.5 }]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.formSubmitText}>Save Address</Text>
        )}
      </Pressable>
    </View>
  );
}

function ComplaintForm({
  onSubmit,
  userPhone,
}: {
  onSubmit: (phone: string, whatsapp: string, message: string) => void;
  userPhone?: string;
}) {
  const [phone, setPhone] = useState(userPhone ?? "");
  const [whatsapp, setWhatsapp] = useState(userPhone ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const ok = phone.trim().length >= 10 && message.trim().length >= 10;

  const handleSave = async () => {
    setSaving(true);
    await onSubmit(phone.trim(), whatsapp.trim(), message.trim());
    setSaving(false);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>🚩 Support Report</Text>
      <Text style={styles.inputHeading}>Phone Number</Text>
      <TextInput
        placeholder="Phone number"
        placeholderTextColor={Colors.light.textTertiary}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.formInput}
        editable={!saving}
      />
      <Text style={styles.inputHeading}>WhatsApp Number</Text>
      <TextInput
        placeholder="WhatsApp number"
        placeholderTextColor={Colors.light.textTertiary}
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
        style={styles.formInput}
        editable={!saving}
      />
      <Text style={styles.inputHeading}>Describe your issue</Text>
      <TextInput
        placeholder="Describe issue (minimum 10 characters)..."
        placeholderTextColor={Colors.light.textTertiary}
        multiline
        numberOfLines={3}
        value={message}
        onChangeText={setMessage}
        style={[styles.formInput, { height: 70, textAlignVertical: "top" }]}
        editable={!saving}
      />
      <Pressable
        disabled={!ok || saving}
        onPress={handleSave}
        style={[styles.formSubmitBtn, !ok && { opacity: 0.5 }]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.formSubmitText}>Submit Report</Text>
        )}
      </Pressable>
    </View>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSubmit(rating, comment.trim());
    setSaving(false);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>⭐ Rate Experience</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)} disabled={saving}>
            <Text style={[styles.starIcon, star <= rating ? styles.starActive : styles.starInactive]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.inputHeading}>Add a comment (Optional):</Text>
      <TextInput
        placeholder="What went well or what can we improve?"
        placeholderTextColor={Colors.light.textTertiary}
        multiline
        numberOfLines={3}
        value={comment}
        onChangeText={setComment}
        style={[styles.formInput, { height: 60, textAlignVertical: "top" }]}
        editable={!saving}
      />
      <Pressable disabled={saving} onPress={handleSave} style={styles.formSubmitBtn}>
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.formSubmitText}>Submit Review</Text>
        )}
      </Pressable>
    </View>
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
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
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
  loaderBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.muted,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    marginLeft: 8,
  },
  footer: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  startOverBtn: {
    paddingVertical: 8,
  },
  startOverBtnText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.medium,
  },
  footerLabel: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    fontFamily: Colors.fonts.regular,
  },

  // Turn Styles
  turnContainer: {
    gap: 10,
    width: "100%",
  },
  botRow: {
    alignSelf: "flex-start",
    maxWidth: "85%",
  },
  botBubble: {
    backgroundColor: Colors.light.muted,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  botText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
    fontFamily: Colors.fonts.regular,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingLeft: 8,
    marginVertical: 4,
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "600",
    fontFamily: Colors.fonts.medium,
  },
  userRow: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    marginTop: 4,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopRightRadius: 4,
  },
  userText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#ffffff",
    fontFamily: Colors.fonts.regular,
  },

  // Form Styles
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 10,
    marginVertical: 6,
    width: "95%",
    alignSelf: "center",
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
    marginBottom: 4,
  },
  formInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tabBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.softPink,
  },
  tabBtnInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: Colors.light.primary,
  },
  tabTextInactive: {
    color: Colors.light.textSecondary,
  },
  inputHeading: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.medium,
    marginTop: 2,
  },
  formSubmitBtn: {
    backgroundColor: Colors.light.primary,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  formSubmitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Colors.fonts.bold,
  },

  // Stars Selector
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 8,
  },
  starIcon: {
    fontSize: 32,
  },
  starActive: {
    color: "#eab308",
  },
  starInactive: {
    color: "rgba(26,10,24,0.1)",
  },
});
