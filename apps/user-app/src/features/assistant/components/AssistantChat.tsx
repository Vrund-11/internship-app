"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isToday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { ServiceType } from "@canovet/shared";
import SearchingPartner from "@/features/booking/components/SearchingPartner";
import type { AskCanoContext } from "./AssistantFab";

type Chip = { label: string; value: string; disabled?: boolean; emoji?: string };
type BotTurn = {
  id: string; text: string;
  chips?: Chip[]; form?: "pet" | "address" | "complaint" | "review"; answer?: string;
};
type Intent = "idle" | "root" | "book" | "mybookings" | "addPet" | "addAddress" | "rate" | "report" | "feedback" | "help" | "cancel" | "reschedule" | "complain";
type ServiceKey = "grooming" | "vet-on-call" | "at-clinic";

const SERVICE_MAP: Record<ServiceKey, ServiceType> = {
  grooming: ServiceType.GROOMING,
  "vet-on-call": ServiceType.VET_ON_CALL,
  "at-clinic": ServiceType.VET_CLINIC,
};

const SLOT_HOURS = [[10,12],[12,14],[14,16],[16,18]] as const;

function buildSlots(date: Date) {
  const todayFlag = isToday(date);
  const nowHour = new Date().getHours();
  return SLOT_HOURS
    .filter(([,end]) => !todayFlag || end > nowHour)
    .map(([s,e]) => {
      const start = new Date(date); start.setHours(s,0,0,0);
      const end2 = new Date(date); end2.setHours(e,0,0,0);
      return { label: `${s}:00 – ${e}:00`, slotStart: start.toISOString(), slotEnd: end2.toISOString() };
    });
}

function dateChips(key: ServiceKey): Chip[] {
  const today = new Date();
  if (key === "vet-on-call") return [{ label: "Today", value: "0", emoji: "📅" }];
  return Array.from({ length: 7 }, (_, i) => ({
    label: i === 0 ? "Tomorrow" : format(addDays(today, i+1), "EEE, d MMM"),
    value: String(i + 1), emoji: i === 0 ? "📅" : undefined,
  }));
}

interface BookCtx {
  bookingId?: string;
  serviceKey?: ServiceKey;
  petId?: string; petName?: string;
  variantLabel?: string;
  dateOffset?: number; dateLabel?: string;
  slotStart?: string; slotEnd?: string; slotLabel?: string;
  addressId?: string; addressLabel?: string;
}

/* ── FAQ answers mapped to complaint categories ── */
const FAQ_MAP: Record<string, string> = {
  LATE: "⏱️ Partners are given a 15-minute grace period after the scheduled slot. If they were much later than that, please report below and we will resolve this immediately.",
  PET_HANDLING: "🐾 Our partners undergo training before onboarding. Any rough or negligent handling is taken very seriously. Please describe the issue below.",
  OVERCHARGING: "💰 All payments are processed securely through the app. Partners must never demand additional cash or offline payments. If this happened, report it below.",
  COMMUNICATION: "💬 Partners should be professional and responsive. If they were inappropriate or unresponsive, let us know below.",
  OTHER: "📝 We're sorry you had a bad experience. Please describe your issue below and we'll get back to you shortly.",
};

export default function AssistantChat({ onClose, active, context }: { onClose: () => void; active: boolean; context?: AskCanoContext | null }) {
  const router = useRouter();
  const { city } = useCity();
  const { user } = useAuth();

  const [intent, setIntent] = useState<Intent>("idle");
  const [turns, setTurns] = useState<BotTurn[]>([]);
  const [bookCtx, setBookCtx] = useState<BookCtx>({});
  const [searching, setSearching] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Track the bookingId when in feedback/report context
  const [feedbackBookingId, setFeedbackBookingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    // If opened with a specific context, go directly to that intent
    if (context?.intent === "review" && context?.bookingId) {
      setTurns([]);
      setIntent("feedback");
      setFeedbackBookingId(context.bookingId);
      setTimeout(() => {
        addBot("Please select a rating out of 5 stars and add a comment if you like (optional):", undefined, "review");
      }, 100);
      return;
    }
    if (context?.intent === "complain") {
      setTurns([]);
      setIntent("idle");
      if (context.bookingId) {
        setTimeout(() => startContextualComplaint(context.bookingId!), 100);
      } else {
        setTimeout(() => startComplainFlow(), 100);
      }
      return;
    }
    if ((context?.intent === "report" || context?.intent === "feedback") && context?.bookingId) {
      setFeedbackBookingId(context.bookingId);
      setTurns([]);
      setIntent("idle");
      // Load the specific booking and start the feedback flow
      setTimeout(() => startContextualFeedback(context.bookingId!), 100);
      return;
    }
    if (context?.intent === "reschedule" && context?.bookingId) {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startContextualReschedule(context.bookingId!), 100);
      return;
    }
    if (context?.intent === "feedback") {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startFeedback(), 100);
      return;
    }
    if (context?.intent === "help") {
      setTurns([]);
      setIntent("idle");
      setTimeout(() => startHelp(), 100);
      return;
    }
    if (turns.length === 0) showRoot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, context]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const addBot = (text: string, chips?: Chip[], form?: BotTurn["form"]) =>
    setTurns(prev => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), text, chips, form }]);

  const lock = (answer: string) =>
    setTurns(prev => { const n = [...prev]; if (n.length) n[n.length-1] = { ...n[n.length-1], answer }; return n; });

  const delay = (fn: () => void, ms = 220) => setTimeout(fn, ms);

  const showRoot = () => {
    setIntent("root");
    setBookCtx({});
    setFeedbackBookingId(null);
    const name = user?.name ? user.name.split(" ")[0] : "there";
    setTurns([{
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
    }]);
  };

  const startOver = () => { setTurns([]); setIntent("idle"); setBookCtx({}); setFeedbackBookingId(null); delay(showRoot, 0); };

  /* ── Book flow ── */
  const startBook = () => {
    setIntent("book");
    setBookCtx({});
    delay(() => addBot("Which service would you like to book?", [
      { label: "Pet Grooming", value: "grooming", emoji: "✂️" },
      { label: "Vet on Call (home)", value: "vet-on-call", emoji: "🩺" },
      { label: "At Clinic", value: "at-clinic", emoji: "🏥" },
    ]));
  };

  const askPets = async (key: ServiceKey) => {
    setLoading(true);
    try {
      const res = await api.get("/booking/pets");
      const pets: { id: string; name: string; type?: string }[] = res.data.pets ?? [];
      const chips: Chip[] = pets.map(p => ({ label: `${p.type === "cat" ? "🐱" : "🐶"} ${p.name}`, value: p.id, emoji: undefined }));
      chips.push({ label: "➕ Add new pet", value: "__add" });
      setBookCtx(c => ({ ...c, serviceKey: key }));
      addBot(pets.length ? "Which pet is this for?" : "No pets yet. Add one first.", chips);
    } catch {
      addBot("Couldn't load pets. Please try again.", [{ label: "Retry", value: "retry_pets" }]);
    } finally { setLoading(false); }
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
    if (!slots.length) { addBot("No slots available for this date.", [{ label: "Pick another date", value: "retry_date" }]); return; }
    addBot("Pick a time slot:", slots.map(s => ({ label: s.label, value: `${s.slotStart}|||${s.slotEnd}` })));
  };

  const askAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/booking/addresses");
      const addrs: { id: string; label?: string; area?: string }[] = res.data.addresses ?? [];
      const chips: Chip[] = addrs.map(a => ({ label: `${a.label ?? "Home"} · ${a.area ?? ""}`, value: a.id, emoji: "🏠" }));
      chips.push({ label: "➕ Add new address", value: "__add_addr" });
      addBot(addrs.length ? "Where should we come?" : "Add an address to continue.", chips);
    } catch {
      addBot("Couldn't load addresses.", [{ label: "Retry", value: "retry_addr" }]);
    } finally { setLoading(false); }
  };

  const showSummary = (ctx: BookCtx) => {
    const svc = ctx.serviceKey === "grooming" ? "Pet Grooming" : ctx.serviceKey === "vet-on-call" ? "Vet on Call" : "At Clinic";
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
      // SearchingPartner will call onPartnerFound after 15s
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

  /* ── My Bookings ── */
  const startMyBookings = async () => {
    setIntent("mybookings");
    setLoading(true);
    try {
      const res = await api.get("/booking/history");
      const bookings: { id: string; serviceType: string; slotStart: string; status: string }[] = res.data.bookings ?? [];
      const recent = bookings.slice(0, 5);
      if (!recent.length) { addBot("No bookings yet! Book a service to get started.", [{ label: "Book now", value: "book" }, { label: "Back", value: "root" }]); return; }
      addBot("Your recent bookings:", recent.map(b => ({
        label: `${b.serviceType.replace(/_/g, " ")} · ${format(new Date(b.slotStart), "d MMM")}`,
        value: `view:${b.id}`,
        emoji: b.status === "CONFIRMED" ? "🟢" : b.status === "COMPLETED" ? "✅" : "📋",
      })));
    } catch { addBot("Couldn't load bookings.", [{ label: "Back", value: "root" }]); }
    finally { setLoading(false); }
  };

  /* ══════════════════════════════════════════════════════════════════════
     UNIFIED FEEDBACK & REVIEW FLOW
     ══════════════════════════════════════════════════════════════════════ */

  // Start feedback flow (shows completed bookings list)
  const startFeedback = async () => {
    setIntent("feedback");
    setLoading(true);
    try {
      const res = await api.get("/booking/history", { params: { status: "COMPLETED", limit: 20 } });
      const done = (res.data.bookings ?? []).slice(0, 5);
      if (!done.length) { addBot("No completed visits to review yet.", [{ label: "Back", value: "root" }]); return; }
      addBot("Which visit would you like to give feedback on?", done.map((b: { id: string; serviceType: string; slotStart: string }) => ({
        label: `${b.serviceType.replace(/_/g," ")} · ${format(new Date(b.slotStart),"d MMM")}`,
        value: `fb:${b.id}`,
      })));
    } catch { addBot("Couldn't load visits.", [{ label: "Back", value: "root" }]); }
    finally { setLoading(false); }
  };

  // Start feedback flow for a specific booking (contextual trigger)
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
        { label: "🏠 Back to menu", value: "root" }
      ]
    );
  };

  const startContextualComplaint = (bookingId: string) => {
    setIntent("complain");
    setFeedbackBookingId(bookingId);
    setBookCtx(prev => ({ ...prev, variantLabel: "BOOKING_ISSUE" }));
    addBot("Please describe your issue below so our team can help:", undefined, "complaint");
  };

  /* ══════════════════════════════════════════════════════════════════════
     HELP & SUPPORT FLOW
     ══════════════════════════════════════════════════════════════════════ */

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

  const startRescheduleFlow = async () => {
    setIntent("reschedule");
    setLoading(true);
    try {
      const res = await api.get("/booking/history", { params: { limit: 100 } });
      const bookings: { id: string; serviceType: string; slotStart: string; status: string }[] = res.data.bookings ?? [];
      const activeBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "AWAITING_PAYMENT");
      if (!activeBookings.length) {
        addBot("You don't have any active bookings that can be rescheduled.", [
          { label: "Back to menu", value: "root" }
        ]);
        return;
      }
      addBot("Which booking would you like to reschedule?", activeBookings.map(b => ({
        label: `${b.serviceType.replace(/_/g, " ")} · ${format(new Date(b.slotStart), "d MMM, h a")}`,
        value: `resched:${b.id}:::${b.serviceType}`,
      })));
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
      if (booking.status !== "CONFIRMED" && booking.status !== "AWAITING_PAYMENT") {
        addBot("This booking cannot be rescheduled.", [{ label: "Back to menu", value: "root" }]);
        return;
      }
      askRescheduleDate(bookingId, booking.serviceType);
    } catch {
      addBot("Couldn't load booking details.", [{ label: "Back to menu", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  const askRescheduleDate = (bId: string, serviceType: string) => {
    const serviceKey = serviceType === "GROOMING"
      ? "grooming"
      : serviceType === "VET_ON_CALL"
      ? "vet-on-call"
      : "at-clinic";

    setBookCtx({
      bookingId: bId,
      serviceKey,
    });

    addBot("Select a new date for rescheduling:", dateChips(serviceKey).map(c => ({
      ...c,
      value: `resched_date:${c.value}`
    })));
  };

  const askRescheduleSlots = (offset: number) => {
    const date = addDays(new Date(), offset);
    const slots = buildSlots(date);
    if (!slots.length) {
      addBot("No slots available for this date.", [
        { label: "Pick another date", value: `resched_retry_date` }
      ]);
      return;
    }
    addBot("Pick a new time slot:", slots.map(s => ({
      label: s.label,
      value: `resched_slot:${s.slotStart}|||${s.slotEnd}`
    })));
  };

  const showRescheduleSummary = (ctx: BookCtx) => {
    const summary = `Confirm rescheduling details:\n• New Date: ${ctx.dateLabel}\n• New Slot: ${ctx.slotLabel}`;
    addBot(summary, [
      { label: "✅ Confirm reschedule", value: "resched_confirm" },
      { label: "❌ Cancel", value: "root" }
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
        { label: "Back to menu", value: "root" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Chip dispatcher ── */
  const onChip = async (chip: Chip) => {
    const v = chip.value;

    // ── External links ──
    if (v.startsWith("extlink:")) {
      const url = v.slice(8);
      window.open(url, "_blank");
      return;
    }

    // ── Root navigation ──
    if (v === "root") { lock("Back to menu"); delay(showRoot); return; }
    if (v === "restart") { lock("Start over"); delay(startBook); return; }
    if (v === "book") { lock("Book a service"); delay(startBook); return; }
    if (v === "mybookings") { lock("My bookings"); delay(startMyBookings); return; }
    if (v === "addPet") { lock("Add a pet"); setIntent("addPet"); delay(() => addBot("Tell me about your pet 🐾", undefined, "pet")); return; }
    if (v === "addAddress") { lock("Add an address"); setIntent("addAddress"); delay(() => addBot("Add your address:", undefined, "address")); return; }
    if (v === "feedback") { lock("Feedback & Review"); delay(startFeedback); return; }
    if (v === "help") { lock("Help & Support"); delay(startHelp); return; }
    // Legacy compatibility
    if (v === "rate") { lock("Rate a visit"); delay(startFeedback); return; }
    if (v === "report") { lock("Report an issue"); delay(startFeedback); return; }

    if (v.startsWith("view:")) { const id = v.split(":")[1]; lock("Open booking"); onClose(); delay(() => router.push(`/bookings/${id}`), 200); return; }
    if (v.startsWith("go_bookings")) { lock("View bookings"); onClose(); delay(() => router.push("/bookings"), 200); return; }

    /* ── Feedback flow chips ── */
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
      delay(() => addBot("Please select a rating out of 5 stars and add a comment if you like (optional):", undefined, "review"));
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
      setBookCtx(prev => ({ ...prev, variantLabel: "BOOKING_ISSUE" }));
      delay(() => addBot(
        "Please describe your issue below so our team can help:",
        undefined,
        "complaint"
      ));
      return;
    }

    /* ── Help flow chips ── */
    if (v === "help_booking") {
      lock("Booking issue");
      delay(startFeedback);
      return;
    }
    if (v === "help_app" || v === "help_payment") {
      lock(chip.label);
      delay(() => addBot(
        "Please describe your issue below so our team can help:",
        undefined,
        "complaint"
      ));
      setFeedbackBookingId(null); // No booking associated
      setBookCtx(prev => ({ ...prev, variantLabel: v === "help_app" ? "APP_ISSUE" : "BILLING" }));
      return;
    }
    if (v === "help_contact") {
      lock("Contact support");
      delay(showContactOptions);
      return;
    }

    /* ── Reschedule flow chips ── */
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
      setBookCtx(c => ({ ...c, dateOffset: offset, dateLabel: chip.label }));
      delay(() => askRescheduleSlots(offset));
      return;
    }
    if (v === "resched_retry_date") {
      lock("Pick another date");
      delay(() => {
        addBot("Select a new date for rescheduling:", dateChips(bookCtx.serviceKey!).map(c => ({
          ...c,
          value: `resched_date:${c.value}`
        })));
      });
      return;
    }
    if (v.startsWith("resched_slot:")) {
      const rawSlot = v.split(":")[1];
      const [ss, se] = rawSlot.split("|||");
      lock(chip.label);
      setBookCtx(c => {
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

    /* ── Book flow ── */
    if (intent === "book") {
      // Service pick
      if (["grooming","vet-on-call","at-clinic"].includes(v) && !bookCtx.serviceKey) {
        lock(chip.label); delay(() => askPets(v as ServiceKey)); return;
      }
      // Pet pick
      if (!bookCtx.petId) {
        if (v === "__add") { lock("Add new pet"); delay(() => addBot("Tell me about your pet 🐾", undefined, "pet")); return; }
        lock(chip.label);
        setBookCtx(c => ({ ...c, petId: v, petName: chip.label.replace(/^[🐶🐱]\s/,"") }));
        delay(() => askVariants(bookCtx.serviceKey!));
        return;
      }
      // Variant pick
      if (!bookCtx.variantLabel) {
        lock(chip.label);
        setBookCtx(c => ({ ...c, variantLabel: chip.label }));
        delay(() => askDates(bookCtx.serviceKey!));
        return;
      }
      // Date pick
      if (bookCtx.dateOffset === undefined) {
        lock(chip.label);
        const offset = Number(v);
        setBookCtx(c => ({ ...c, dateOffset: offset, dateLabel: chip.label }));
        delay(() => askSlots(offset));
        return;
      }
      // Slot pick
      if (!bookCtx.slotStart) {
        lock(chip.label);
        const [ss, se] = v.split("|||");
        setBookCtx(c => ({ ...c, slotStart: ss, slotEnd: se, slotLabel: chip.label }));
        if (bookCtx.serviceKey === "at-clinic") {
          delay(() => addBot("At-clinic visits need to be booked in person. Please call us.", [{ label: "Back to menu", value: "root" }]));
        } else {
          delay(() => askAddresses());
        }
        return;
      }
      // Address pick
      if (!bookCtx.addressId) {
        if (v === "__add_addr") { lock("Add new address"); delay(() => addBot("Add your address:", undefined, "address")); return; }
        lock(chip.label);
        const updatedCtx = { ...bookCtx, addressId: v, addressLabel: chip.label };
        setBookCtx(updatedCtx);
        delay(() => showSummary(updatedCtx));
        return;
      }
      // Confirm
      if (v === "confirm") { doConfirm(bookCtx); return; }
      if (v === "retry_pets") { delay(() => askPets(bookCtx.serviceKey!)); return; }
      if (v === "retry_addr") { delay(askAddresses); return; }
      if (v === "retry_date") { delay(() => askDates(bookCtx.serviceKey!)); return; }
    }
  };

  /* ── Pet form submit ── */
  const handlePetSubmit = async (name: string, type: string, breed: string, age: string, weight: string) => {
    try {
      const res = await api.post("/booking/pets", { name, type, breed, age: Number(age), weight: Number(weight) });
      const pet = res.data.pet ?? res.data;
      lock(`${type === "cat" ? "🐱" : "🐶"} ${name} added`);
      if (intent === "book" && bookCtx.serviceKey) {
        setBookCtx(c => ({ ...c, petId: pet.id, petName: name }));
        delay(() => askVariants(bookCtx.serviceKey!));
      } else {
        delay(() => addBot(`${name} is added! 🐾`, [{ label: "Book now", value: "book" }, { label: "Back to menu", value: "root" }]));
      }
    } catch { addBot("Failed to save pet. Please try again.", [{ label: "Back", value: "root" }]); }
  };

  /* ── Address form submit ── */
  const handleAddressSubmit = async (label: string, area: string, city2: string, pincode: string) => {
    try {
      const res = await api.post("/booking/addresses", { label, area, city: city2, pincode, house: area });
      const addr = res.data.address ?? res.data;
      lock(`${label} added`);
      if (intent === "book" && bookCtx.slotStart) {
        const updatedCtx = { ...bookCtx, addressId: addr.id, addressLabel: `${label} · ${area}` };
        setBookCtx(updatedCtx);
        delay(() => showSummary(updatedCtx));
      } else {
        delay(() => addBot("Address saved! 🏠", [{ label: "Book a service", value: "book" }, { label: "Back to menu", value: "root" }]));
      }
    } catch { addBot("Failed to save address.", [{ label: "Back", value: "root" }]); }
  };

  /* ── Complaint form submit ── */
  const handleComplaintSubmit = async (phone: string, whatsapp: string, message: string) => {
    try {
      setLoading(true);
      lock("Submitted");
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
          [{ label: "Back to menu", value: "root" }]
        );
      } else {
        addBot(
          "✅ Your report has been registered. Our team will review it and contact you within 24 hours. Thank you for your patience. 🙏",
          [{ label: "Back to menu", value: "root" }]
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit. Please try again.";
      addBot(`❌ ${msg}`, [{ label: "Back to menu", value: "root" }]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Review form submit ── */
  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      setLoading(true);
      lock(`Submitted: ${rating}/5 stars`);
      await api.post("/review", {
        bookingId: feedbackBookingId,
        rating,
        comment: comment || undefined
      });
      delay(() => addBot("Thank you! Your review has been recorded. 🐾", [{ label: "Back to menu", value: "root" }]));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to submit review";
      delay(() => addBot(`❌ ${msg}`, [{ label: "Back to menu", value: "root" }]));
    } finally {
      setLoading(false);
    }
  };

  if (searching) {
    return (
      <div className="flex-1 overflow-y-auto">
        <SearchingPartner onFound={onPartnerFound} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
        {loading && <TypingIndicator />}
      </div>
      <div className="border-t border-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <button onClick={startOver} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ↺ Start over
        </button>
        <p className="text-[11px] text-muted-foreground">Tap an option above</p>
      </div>
    </div>
  );
}

/* ── Typing indicator (three bouncing dots) ── */
function TypingIndicator() {
  return (
    <div className="flex animate-fade-in-up">
      <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

/* ── TurnView ── */
function TurnView({ turn, isLast, onChip, onPetSubmit, onAddressSubmit, onComplaintSubmit, onReviewSubmit, disabled, userPhone }: {
  turn: BotTurn; isLast: boolean;
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
    <div className="space-y-2 animate-fade-in-up">
      <div className="flex">
        <div className="max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-line">
          {turn.text}
        </div>
      </div>
      {!locked && turn.chips && (
        <div className={cn("flex flex-wrap gap-2 pl-1", disabled && "opacity-50 pointer-events-none")}>
          {turn.chips.map(c => (
            <button
              key={c.value}
              disabled={c.disabled || disabled}
              onClick={() => onChip(c)}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-sm bg-card",
                "hover:bg-accent/10 hover:border-primary/40 active:scale-95 transition-all",
                (c.disabled || disabled) && "opacity-40 cursor-not-allowed",
              )}
            >
              {c.emoji && <span className="mr-1">{c.emoji}</span>}{c.label}
            </button>
          ))}
        </div>
      )}
      {!locked && turn.form === "pet" && isLast && <PetForm onSubmit={onPetSubmit} />}
      {!locked && turn.form === "address" && isLast && <AddressForm onSubmit={onAddressSubmit} />}
      {!locked && turn.form === "complaint" && isLast && <ComplaintForm onSubmit={onComplaintSubmit} userPhone={userPhone} />}
      {!locked && turn.form === "review" && isLast && <ReviewForm onSubmit={onReviewSubmit} />}
      {locked && (
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
            {turn.answer}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pet inline form ── */
function PetForm({ onSubmit }: { onSubmit: (name: string, type: string, breed: string, age: string, weight: string) => void }) {
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
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <Input placeholder="Pet name" value={name} onChange={e => setName(e.target.value)} className="h-10 rounded-xl" disabled={saving} />
      <div className="flex gap-2">
        {["dog","cat"].map(t => (
          <button key={t} onClick={() => setType(t)} disabled={saving}
            className={cn("flex-1 rounded-xl border py-2 text-sm capitalize transition-colors",
              type === t ? "border-primary bg-secondary" : "border-border")}
          >
            {t === "dog" ? "🐶" : "🐱"} {t}
          </button>
        ))}
      </div>
      <Input placeholder="Breed" value={breed} onChange={e => setBreed(e.target.value)} className="h-10 rounded-xl" disabled={saving} />
      <div className="flex gap-2">
        <Input placeholder="Age (yrs)" value={age} onChange={e => setAge(e.target.value)} className="h-10 rounded-xl" inputMode="numeric" disabled={saving} />
        <Input placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} className="h-10 rounded-xl" inputMode="numeric" disabled={saving} />
      </div>
      <Button disabled={!ok || saving} onClick={handleSave} className="w-full rounded-full h-10">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save pet"}
      </Button>
    </div>
  );
}

/* ── Address inline form ── */
function AddressForm({ onSubmit }: { onSubmit: (label: string, area: string, city: string, pincode: string) => void }) {
  const [label, setLabel] = useState("Home");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const ok = area.trim() && city.trim() && pincode.length >= 6;
  const handleSave = async () => {
    setSaving(true);
    await onSubmit(label, area.trim(), city.trim(), pincode);
    setSaving(false);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <div className="flex gap-2">
        {["Home","Work","Other"].map(l => (
          <button key={l} onClick={() => setLabel(l)} disabled={saving}
            className={cn("flex-1 rounded-xl border py-2 text-sm transition-colors",
              label === l ? "border-primary bg-secondary" : "border-border")}
          >
            {l}
          </button>
        ))}
      </div>
      <Input placeholder="Area / Locality" value={area} onChange={e => setArea(e.target.value)} className="h-10 rounded-xl" disabled={saving} />
      <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="h-10 rounded-xl" disabled={saving} />
      <Input placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} className="h-10 rounded-xl" inputMode="numeric" maxLength={6} disabled={saving} />
      <Button disabled={!ok || saving} onClick={handleSave} className="w-full rounded-full h-10">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save address"}
      </Button>
    </div>
  );
}

/* ── Complaint inline form ── */
function ComplaintForm({ onSubmit, userPhone }: { onSubmit: (phone: string, whatsapp: string, message: string) => void; userPhone?: string }) {
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
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium">📱 Contact Details</p>
      <Input
        placeholder="Phone number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="h-10 rounded-xl"
        inputMode="tel"
        disabled={saving}
      />
      <Input
        placeholder="WhatsApp number"
        value={whatsapp}
        onChange={e => setWhatsapp(e.target.value)}
        className="h-10 rounded-xl"
        inputMode="tel"
        disabled={saving}
      />
      <p className="text-xs text-muted-foreground font-medium pt-1">📝 Describe your issue</p>
      <textarea
        placeholder="Please describe your issue in detail (minimum 10 characters)..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full min-h-[80px] rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        disabled={saving}
      />
      <Button disabled={!ok || saving} onClick={handleSave} className="w-full rounded-full h-10">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "🚩 Submit Report"}
      </Button>
    </div>
  );
}

/* ── Review inline form ── */
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm animate-scale-in">
      <p className="text-xs font-semibold text-muted-foreground">⭐ Rate your experience:</p>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            disabled={saving}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <span className={cn(
              "text-3xl transition-colors",
              star <= rating ? "text-yellow-400" : "text-muted/30"
            )}>
              ★
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground">Add a comment (Optional):</p>
        <textarea
          placeholder="What went well or what can we improve?"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full min-h-[60px] rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={saving}
        />
      </div>

      <Button disabled={saving} onClick={handleSave} className="w-full rounded-full h-10 font-bold">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Review"}
      </Button>
    </div>
  );
}
