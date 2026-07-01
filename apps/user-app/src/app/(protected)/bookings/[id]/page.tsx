"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageSquare, RefreshCw, Star, Check, X, ChevronDown, User } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import RateAndReport from "@/features/bookings/components/RateAndReport";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { api } from "@/lib/api";
import { getServiceSlug } from "@/features/home/data/services";

type BookingDetail = {
  id: string;
  serviceType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  createdAt: string;
  pet?: { id: string; name: string; type: string; breed?: string; age?: number; weight?: number };
  address?: { id: string; house?: string; area?: string; city?: string; state?: string; text?: string };
  partner?: { id: string; name: string; phone?: string; rating?: number; totalCompleted?: number };
  review?: { id: string; rating: number; comment?: string | null } | null;
  complaints?: { id: string; message: string; status: string }[];
  amount?: number;
  payments?: Array<{ id: string; amount: number; status: string; method: string; createdAt: string }>;
  rescheduleLogs?: { id: string; createdAt: string }[];
};

const serviceLabels: Record<string, string> = {
  GROOMING: "Grooming",
  VET_ON_CALL: "Vet on Call",
  VET_CLINIC: "At Clinic",
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>("specialist");

  const toggleMobileSection = (section: string) => {
    setMobileOpenSection(mobileOpenSection === section ? null : section);
  };

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/booking/${bookingId}`);
      setBooking(res.data as BookingDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const performCancellation = async () => {
    try {
      setCancelling(true);
      setCancelError("");
      await api.post(`/booking/${bookingId}/cancel`);
      setConfirmingCancel(false);
      await loadBooking();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to cancel booking";
      setCancelError(msg);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          Loading booking...
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center">
          <p className="mb-3 font-medium text-foreground">
            {error || "Booking not found."}
          </p>
          <Button onClick={() => router.push("/bookings")} className="rounded-full">
            Back to Bookings
          </Button>
        </div>
      </AppShell>
    );
  }

  const isRebookable =
    booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "FAILED";

  const isActive = booking.status === "CONFIRMED" || booking.status === "AWAITING_PAYMENT";
  const isPast = booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "FAILED";
  const slotStart = new Date(booking.slotStart);
  const hoursToStart = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
  const isFreeCancellation = hoursToStart >= 8;

  const serviceLabel = serviceLabels[booking.serviceType] ?? "Service";

  const payment = booking.payments?.[0];
  const isPaid = payment?.status === "PAID" || payment?.status === "SUCCESS";
  const isOffline = payment?.method === "offline";
  const totalAmount = booking.amount ?? 0;
  const platformFee = totalAmount > 50 ? 50 : 0;
  const serviceFee = totalAmount - platformFee;

  const isRescheduled = booking.rescheduleLogs && booking.rescheduleLogs.length > 0;
  const isCancelled = booking.status === "CANCELLED";
  const isFailed = booking.status === "FAILED";
  const isCompleted = booking.status === "COMPLETED";

  // Determine badge text
  let desktopBadgeText = "Specialist Assigned";
  if (isCancelled) {
    desktopBadgeText = "Cancelled";
  } else if (isFailed) {
    desktopBadgeText = "Failed";
  } else if (isCompleted) {
    desktopBadgeText = "Completed";
  } else if (isRescheduled) {
    desktopBadgeText = "Rescheduled";
  }

  // Determine title
  let desktopTitle = "Ready For Your Visit";
  if (isCancelled) {
    desktopTitle = "Booking Cancelled";
  } else if (isFailed) {
    desktopTitle = "Booking Failed";
  } else if (isCompleted) {
    desktopTitle = isRescheduled ? "Rescheduled Booking Completed" : "Booking Completed";
  } else if (isRescheduled) {
    desktopTitle = "Rescheduled Visit";
  }

  // Determine description
  let desktopDesc = `Your ${serviceLabel.toLowerCase()} with ${booking.partner?.name ?? "our specialist"} is confirmed. See details below.`;
  if (isCancelled) {
    desktopDesc = `Your ${serviceLabel.toLowerCase()} session has been cancelled.`;
  } else if (isFailed) {
    desktopDesc = `Your ${serviceLabel.toLowerCase()} session has failed.`;
  } else if (isCompleted) {
    desktopDesc = isRescheduled
      ? `Your rescheduled ${serviceLabel.toLowerCase()} session has been completed. See details below.`
      : `Your ${serviceLabel.toLowerCase()} session has been completed. See details below.`;
  } else if (isRescheduled) {
    desktopDesc = `Your rescheduled ${serviceLabel.toLowerCase()} with ${booking.partner?.name ?? "our specialist"} is confirmed.`;
  }

  // Status badge styling for desktop hero
  const heroBadgeClass = isCancelled || isFailed
    ? "bg-rose-500/20 text-rose-200 border border-rose-400/30"
    : isCompleted
    ? "bg-[#FF10F0]/20 text-[#FF10F0] border border-[#FF10F0]/30"
    : isRescheduled
    ? "bg-white/20 text-white border border-white/30"
    : "bg-[#FF10F0]/20 text-[#FF10F0] border border-[#FF10F0]/30";

  return (
    <AppShell>
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm font-bold text-[#4A4A4A] bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-[#121212] capitalize">
            {booking.serviceType.replace(/_/g, " ").toLowerCase()}
          </h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold capitalize border",
              isCancelled
                ? "bg-rose-500/10 text-rose-600 border-rose-200/30"
                : (isCompleted && isRescheduled)
                ? "bg-purple-100 text-purple-700 border-purple-200/50"
                : isCompleted
                ? "bg-gray-100 text-gray-500 border-gray-200/30"
                : "bg-[#FFF0FC] text-[#FF10F0] border-[#FF10F0]/20"
            )}
          >
            {isCancelled
              ? "cancelled"
              : (isCompleted && isRescheduled)
              ? "rescheduled"
              : booking.status.replace(/_/g, " ").toLowerCase()}
          </span>
        </div>
        <p className="mb-5 text-[11px] font-mono font-bold text-[#4A4A4A]">{booking.id}</p>

        {/* Accordions */}
        <div className="space-y-3 mb-8">
          {/* 1. Specialist Details Accordion */}
          {booking.partner && (
            <div className="bg-white rounded-2xl border border-[#EDE4EB] overflow-hidden shadow-card">
              <button
                onClick={() => toggleMobileSection("specialist")}
                className="w-full flex items-center justify-between p-4 bg-[#FFF0FC] text-[#FF10F0] font-extrabold text-[15px] border-none text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-[#FF10F0]" />
                  Specialist Details
                </span>
                <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", mobileOpenSection === "specialist" && "rotate-180")} />
              </button>
              {mobileOpenSection === "specialist" && (
                <div className="p-4 space-y-4 animate-fade-in-up">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white border border-[#FF10F0]/10" style={{ background: "linear-gradient(135deg, #FF10F0, #A7009D)" }}>
                      {booking.partner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[16px] font-extrabold text-[#121212]">{booking.partner.name}</div>
                      <div className="text-[12px] text-[#4A4A4A] mt-0.5 font-semibold">
                        {booking.partner.rating ? `⭐ ${booking.partner.rating.toFixed(1)} rating` : "Assigned specialist"}
                        {booking.partner.totalCompleted ? ` · ${booking.partner.totalCompleted} jobs` : ""}
                      </div>
                    </div>
                  </div>
                  {booking.partner.phone && (
                    <div className="flex gap-2 pt-2 border-t border-[#F8F8F8]">
                      <a
                        href={`tel:${booking.partner.phone}`}
                        className="flex-1 py-3 border border-[#EDE4EB] rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold text-[#4A4A4A] bg-[#F8F8F8] hover:bg-neutral-100 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#FF10F0]" />
                        Call
                      </a>
                      <a
                        href={`sms:${booking.partner.phone}`}
                        className="flex-1 py-3 border border-[#EDE4EB] rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold text-[#4A4A4A] bg-[#F8F8F8] hover:bg-neutral-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-[#FF10F0]" />
                        SMS
                      </a>
                      <a
                        href={`https://wa.me/${booking.partner.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 border border-[#EDE4EB] rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold text-[#4A4A4A] bg-[#F8F8F8] hover:bg-neutral-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-[#FF10F0]" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Preparation Checklist Accordion */}
          {!isPast && (
            <div className="bg-white rounded-2xl border border-[#EDE4EB] overflow-hidden shadow-card">
              <button
                onClick={() => toggleMobileSection("checklist")}
                className="w-full flex items-center justify-between p-4 bg-[#F8F8F8] text-[#121212] font-extrabold text-[15px] border-none text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4.5 h-4.5 text-[#FF10F0]" />
                  Preparation Checklist
                </span>
                <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", mobileOpenSection === "checklist" && "rotate-180")} />
              </button>
              {mobileOpenSection === "checklist" && (
                <div className="p-4 space-y-3 animate-fade-in-up">
                  {["Secure your pet in a quiet room", "Have medical records ready", "No food 2 hours prior to visit"].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded border border-[#FF10F0] bg-[#FFF0FC] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#FF10F0] stroke-[3px]" />
                      </div>
                      <p className="text-[13px] font-semibold text-[#4A4A4A]">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Appointment Details Accordion */}
          <div className="bg-white rounded-2xl border border-[#EDE4EB] overflow-hidden shadow-card">
            <button
              onClick={() => toggleMobileSection("details")}
              className="w-full flex items-center justify-between p-4 bg-[#F8F8F8] text-[#121212] font-extrabold text-[15px] border-none text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-[#FF10F0]" />
                Appointment Details
              </span>
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", mobileOpenSection === "details" && "rotate-180")} />
            </button>
            {mobileOpenSection === "details" && (
              <div className="p-4 space-y-4 animate-fade-in-up">
                  {/* Booking ID — full width to avoid overflow */}
                  <div className="bg-[#F8F8F8] rounded-xl px-3 py-2.5 border border-[#EDE4EB]">
                    <span className="text-[#4A4A4A] font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Booking ID</span>
                    <span className="font-bold text-[#121212] font-mono text-[11px] block truncate">{booking.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[13px] border-b border-[#EDE4EB]/30 pb-3.5">
                    <div>
                      <span className="text-[#4A4A4A] font-semibold block text-[11px] uppercase tracking-wide">Status</span>
                      <span className="font-extrabold text-[#FF10F0] capitalize">{booking.status.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                    <div>
                      <span className="text-[#4A4A4A] font-semibold block text-[11px] uppercase tracking-wide">Date</span>
                      <span className="font-extrabold text-[#121212]">{format(new Date(booking.slotStart), "EEE, d MMM yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-[#4A4A4A] font-semibold block text-[11px] uppercase tracking-wide">Time</span>
                      <span className="font-extrabold text-[#121212]">
                        {format(new Date(booking.slotStart), "hh:mm a")} - {format(new Date(booking.slotEnd), "hh:mm a")}
                      </span>
                    </div>
                  </div>

                {/* Pet info card */}
                {booking.pet && (
                  <div className="bg-[#F8F8F8] rounded-xl p-3.5 border border-[#EDE4EB]">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A4A4A] mb-1.5">Pet Profile</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[14px] font-extrabold text-[#121212]">{booking.pet.name}</p>
                        <p className="text-[11px] text-[#4A4A4A] mt-0.5 font-semibold">
                          {booking.pet.breed ?? "Mixed"}
                          {booking.pet.age ? ` · ${booking.pet.age}y` : ""}
                          {booking.pet.weight ? ` · ${booking.pet.weight}kg` : ""}
                        </p>
                      </div>
                      <span className="bg-[#FFF0FC] text-[#FF10F0] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.4px] uppercase border border-[#FF10F0]/20">
                        {booking.pet.type === "cat" ? "🐈 Cat" : "🐕 Dog"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Address info */}
                {booking.address && (
                  <div className="bg-[#F8F8F8] rounded-xl p-3.5 border border-[#EDE4EB]">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A4A4A] mb-1.5">Service Location</p>
                    <p className="text-[13px] font-bold text-[#121212] leading-snug">
                      {booking.address.house || booking.address.text || "Address unavailable"}
                    </p>
                    <p className="text-[12px] text-[#4A4A4A] font-semibold mt-0.5">
                      {booking.address.area ? `${booking.address.area}, ` : ""}
                      {booking.address.city || ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Payment Details Accordion */}
          <div className="bg-white rounded-2xl border border-[#EDE4EB] overflow-hidden shadow-card">
            <button
              onClick={() => toggleMobileSection("payment")}
              className="w-full flex items-center justify-between p-4 bg-[#F8F8F8] text-[#121212] font-extrabold text-[15px] border-none text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-[#FF10F0] text-base">💳</span>
                Payment Details
              </span>
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", mobileOpenSection === "payment" && "rotate-180")} />
            </button>
            {mobileOpenSection === "payment" && (
              <div className="p-4 space-y-4 animate-fade-in-up">
                {/* Payment method */}
                <div className="flex items-center gap-3 bg-[#F8F8F8] rounded-xl p-3 border border-[#EDE4EB]">
                  <span className="text-lg">{isPaid ? "✅" : "💳"}</span>
                  <div>
                    <p className="text-[13px] font-extrabold text-[#121212]">
                      {isOffline ? "Pay After Service" : "Paid Online"}
                    </p>
                    <p className="text-[11px] text-[#4A4A4A] font-semibold">
                      {isOffline ? "Cash or UPI after completion" : "Paid via UPI / Card"}
                    </p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#4A4A4A] font-semibold">{serviceLabel} Service</span>
                    <span className="font-bold text-[#121212]">₹{serviceFee}</span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#4A4A4A] font-semibold">Service Fee</span>
                      <span className="font-bold text-[#121212]">₹{platformFee}</span>
                    </div>
                  )}
                  {payment?.id && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#4A4A4A] font-semibold">Payment ID</span>
                      <span className="font-bold text-[#121212] font-mono text-[11px]">{payment.id}</span>
                    </div>
                  )}
                  {payment?.createdAt && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#4A4A4A] font-semibold">Payment Date</span>
                      <span className="font-bold text-[#121212]">{format(new Date(payment.createdAt), "d MMM yyyy")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2.5 mt-1 border-t border-[#EDE4EB]">
                    <span className="text-[14px] font-extrabold text-[#121212]">Total {isPast ? "Paid" : "Due"}</span>
                    <span className="text-[16px] font-extrabold text-[#FF10F0]">₹{totalAmount}</span>
                  </div>
                </div>

                {/* Payment status badge */}
                <div className={cn(
                  "rounded-xl px-3 py-2 text-center text-[12px] font-bold border",
                  isPaid
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                    : "bg-amber-50 text-amber-600 border-amber-200/50"
                )}>
                  {isPaid
                    ? "✓ Payment Completed"
                    : payment?.status === "REFUNDED"
                    ? "✓ Refunded Successfully"
                    : payment?.status === "PARTIALLY_REFUNDED"
                    ? "✓ Partially Refunded (80%)"
                    : payment?.status === "CANCELLED"
                    ? "✕ Payment Cancelled"
                    : "Payment will be collected after service"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        {isActive && !confirmingCancel ? (
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-cano", {
                    detail: { intent: "reschedule", bookingId: booking.id },
                  })
                );
              }}
              className="w-full py-4 bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white rounded-full text-[14px] font-extrabold transition-all border-none cursor-pointer shadow-md active:scale-[0.98]"
            >
              Reschedule Visit
            </button>
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={hoursToStart < 4}
              className="w-full py-4 border border-[#121212] text-[#121212] bg-transparent hover:bg-[#F8F8F8] rounded-full text-[14px] font-extrabold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel Booking
            </button>
            {hoursToStart < 4 && (
              <p className="text-[11px] text-[#E05C35] font-bold mt-1 text-center">
                Cancellation closed (less than 4 hours remaining)
              </p>
            )}
          </div>
        ) : null}

        {isActive && confirmingCancel ? (
          <div className="mb-5 space-y-4 rounded-3xl border border-rose-200 bg-rose-500/[0.02] p-5 shadow-sm animate-fade-in">
            <div>
              <h3 className="text-sm font-extrabold text-rose-600 tracking-tight">Confirm cancellation</h3>
              <p className="mt-1.5 text-xs text-[#4A4A4A] leading-relaxed font-semibold">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              {isFreeCancellation ? (
                <div className="mt-3 rounded-2xl bg-emerald-500/5 border border-emerald-100 p-3">
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    ✓ Free cancellation is available. You will receive a full refund.
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-rose-500/5 border border-rose-100 p-3">
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    ⚠️ Cancelling now will incur a 20% penalty fee (80% refund).
                  </p>
                </div>
              )}
            </div>
            {cancelError && (
              <p className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl">⚠️ {cancelError}</p>
            )}
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={performCancellation}
                disabled={cancelling}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[14px] font-extrabold border-none cursor-pointer"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelling}
                className="w-full py-3.5 border border-[#EDE4EB] text-[#121212] rounded-full text-[14px] font-extrabold bg-white hover:bg-[#F8F8F8] cursor-pointer"
              >
                Keep Booking
              </button>
            </div>
          </div>
        ) : null}

        {booking.status === "COMPLETED" ? (
          <RateAndReport booking={booking} onUpdated={loadBooking} />
        ) : null}

        {isRebookable ? (
          <button
            onClick={() =>
              router.push(
                `/service/${getServiceSlug(booking.serviceType)}?rebook=${booking.id}`
              )
            }
            className="mt-6 w-full py-4 bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white rounded-full text-[14px] font-extrabold border-none shadow-md active:scale-[0.98]"
          >
            Book Again
          </button>
        ) : null}
      </div>

      {/* ===== DESKTOP VIEW (Design MD compliant) ===== */}
      <div className="hidden md:block" style={{ background: "#F8F8F8" }}>
        <main className="max-w-[1280px] mx-auto px-10 py-8">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center justify-center w-9 h-9 rounded-lg border border-[#EDE4EB] bg-white hover:bg-[#F8F8F8] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#121212]" />
          </button>

          {/* Hero Header — unified Deep Charcoal */}
          <header className="mb-8 p-8 rounded-2xl text-white shadow-lg overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #121212 0%, #1e1e1e 60%, #2a2a2a 100%)" }}
          >
            {/* Subtle neon glow accent */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FF10F0 0%, transparent 70%)" }} />
            <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #FF10F0 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("px-4 py-1.5 rounded-full font-label-md flex items-center gap-1.5 text-sm font-bold", heroBadgeClass)}>
                  {isCancelled || isFailed ? (
                    <><X className="w-3.5 h-3.5" /> {desktopBadgeText}</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> {desktopBadgeText}</>
                  )}
                </span>
                {/* Service chip */}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80 border border-white/10">
                  {serviceLabel}
                </span>
              </div>
              <h1 className="font-headline-lg text-white mb-1">
                {desktopTitle}
              </h1>
              <p className="text-white/70 font-body-lg">
                {desktopDesc}
              </p>
            </div>
          </header>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="md:col-span-8 space-y-6">
              {/* Partner Card */}
              {booking.partner && (
                <section className="bg-white rounded-xl p-6 custom-shadow border border-[#EDE4EB] flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 aspect-square bg-[#F8F8F8] rounded-lg overflow-hidden flex items-center justify-center border border-[#EDE4EB]">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #FF10F0, #A7009D)" }}
                    >
                      {booking.partner.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-headline-md text-[#121212]">{booking.partner.name}</h2>
                      </div>
                      <p className="font-semibold mb-2 text-[#FF10F0]">
                        {serviceLabel} Specialist{booking.partner.totalCompleted ? ` · ${booking.partner.totalCompleted} sessions` : ""}
                      </p>
                      <div className="flex items-center gap-1 mb-4">
                        <Star className="w-4 h-4 text-amber-500" fill="#f59e0b" />
                        <span className="font-label-md text-[#121212]">
                          {booking.partner.rating ? booking.partner.rating.toFixed(1) : "—"} ({booking.partner.totalCompleted ?? 0} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#EDE4EB]">
                      {booking.partner.phone ? (
                        <>
                          <a
                            href={`tel:${booking.partner.phone}`}
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#F8F8F8] border border-[#EDE4EB] rounded-lg hover:bg-[#FFF0FC] hover:border-[#FF10F0]/20 transition-colors text-center text-[#121212]"
                          >
                            <Phone className="w-5 h-5 text-[#FF10F0]" />
                            <span className="font-label-sm text-[#4A4A4A]">Call</span>
                          </a>
                          <a
                            href={`sms:${booking.partner.phone}`}
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#F8F8F8] border border-[#EDE4EB] rounded-lg hover:bg-[#FFF0FC] hover:border-[#FF10F0]/20 transition-colors text-center text-[#121212]"
                          >
                            <MessageSquare className="w-5 h-5 text-[#FF10F0]" />
                            <span className="font-label-sm text-[#4A4A4A]">SMS</span>
                          </a>
                          <a
                            href={`https://wa.me/${booking.partner.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#F8F8F8] border border-[#EDE4EB] rounded-lg hover:bg-[#FFF0FC] hover:border-[#FF10F0]/20 transition-colors text-center text-[#121212]"
                          >
                            <MessageSquare className="w-5 h-5 text-[#FF10F0]" />
                            <span className="font-label-sm text-[#4A4A4A]">WhatsApp</span>
                          </a>
                        </>
                      ) : (
                        <div className="col-span-3 text-center py-2 text-xs text-muted-foreground bg-muted/30 rounded-lg">
                          Contact details available once session starts.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Booking & Payment Summary */}
              <section className="space-y-4">
                <h3 className="font-headline-sm text-[#121212] px-1">Booking & Payment Summary</h3>
                <div className="bg-white rounded-xl custom-shadow border border-[#EDE4EB] overflow-hidden">
                  <div className="p-4 border-b border-[#EDE4EB] bg-[#F8F8F8]">
                    <h4 className="font-label-md uppercase tracking-wider text-[#4A4A4A]">Payment Information</h4>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[#FF10F0]">{isPaid ? "✅" : "💳"}</span>
                      <div>
                        <p className="font-body-md font-semibold text-[#121212]">
                          {isOffline ? "Pay After Service" : "Paid Online"}
                        </p>
                        <p className="font-label-md text-[#4A4A4A]">
                          {isOffline
                            ? `Cash or UPI after completion · ID: ${booking.id.slice(0, 12)}`
                            : `Paid via UPI/Card · ID: ${booking.id.slice(0, 12)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                   <div className="p-4 bg-[#F8F8F8]/50 border-t border-[#EDE4EB]">
                    <h4 className="font-label-md uppercase tracking-wider text-[#4A4A4A] mb-4">Price Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between font-body-md text-[#4A4A4A]">
                        <span>{serviceLabel} Service</span>
                        <span>₹{serviceFee}</span>
                      </div>
                      {platformFee > 0 && (
                        <div className="flex justify-between font-body-md text-[#4A4A4A]">
                          <span>Service Fee</span>
                          <span>₹{platformFee}</span>
                        </div>
                      )}
                      {payment?.id && (
                        <div className="flex justify-between font-body-md text-[#4A4A4A]">
                          <span>Payment ID</span>
                          <span className="font-mono text-xs">{payment.id}</span>
                        </div>
                      )}
                      {payment?.createdAt && (
                        <div className="flex justify-between font-body-md text-[#4A4A4A]">
                          <span>Payment Date</span>
                          <span>{format(new Date(payment.createdAt), "d MMM yyyy")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold font-headline-sm pt-2 border-t border-[#EDE4EB] text-[#121212]">
                        <span>Total {isPast ? "Paid" : "Due"}</span>
                        <span className="text-[#FF10F0]">₹{totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rate & Report for completed bookings */}
              {booking.status === "COMPLETED" && (
                <RateAndReport booking={booking} onUpdated={loadBooking} />
              )}
            </div>

            {/* Right Column */}
            <div className="md:col-span-4 space-y-6">
              {/* Checklist Card — Deep Charcoal with Neon Pink accents */}
              {!isPast && (
                <section
                  className="p-8 rounded-xl text-white shadow-lg relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)" }}
                >
                  <div className="absolute -right-6 -bottom-6 opacity-5">
                    <span className="text-[100px]">🐾</span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-[#FF10F0]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#FF10F0]" />
                      </div>
                      <h3 className="font-headline-sm text-white">Pet Parent Checklist</h3>
                    </div>
                    <div className="space-y-4">
                      {["Secure your pet in a quiet room", "Medical records ready", "No food 2 hours prior"].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 rounded border border-[#FF10F0]/50 bg-[#FF10F0]/10 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#FF10F0]" />
                          </div>
                          <p className="font-body-md text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Appointment Details */}
              <section className="bg-white p-6 rounded-xl border border-[#EDE4EB] custom-shadow">
                <h3 className="font-label-md uppercase tracking-wider text-[#4A4A4A] mb-4">Appointment Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#EDE4EB]/50">
                    <span className="text-[#4A4A4A] font-body-md">Time</span>
                    <span className="font-bold text-[#121212] text-sm">
                      {format(new Date(booking.slotStart), "hh:mm a")} - {format(new Date(booking.slotEnd), "hh:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#EDE4EB]/50">
                    <span className="text-[#4A4A4A] font-body-md">Date</span>
                    <span className="font-bold text-[#121212] text-sm">
                      {format(new Date(booking.slotStart), "EEE, d MMM yyyy")}
                    </span>
                  </div>
                  {booking.pet && (
                    <div className="flex justify-between items-center py-2 border-b border-[#EDE4EB]/50">
                      <span className="text-[#4A4A4A] font-body-md">Pet Profile</span>
                      <span className="font-bold text-[#121212] text-sm">{booking.pet.name} ({booking.pet.breed ?? "Mixed"})</span>
                    </div>
                  )}
                  {booking.address && (
                    <div className="flex justify-between items-start py-2 border-b border-[#EDE4EB]/50">
                      <span className="text-[#4A4A4A] font-body-md shrink-0">Address</span>
                      <span className="font-bold text-[#121212] text-right text-sm ml-4">
                        {booking.address.area ? `${booking.address.area}, ` : ""}
                        {booking.address.city ?? booking.address.text ?? "—"}
                      </span>
                    </div>
                  )}
                </div>

                {isActive && !confirmingCancel && (
                  <>
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("open-ask-cano", {
                            detail: { intent: "reschedule", bookingId: booking.id },
                          })
                        );
                      }}
                      className="w-full mt-6 bg-[#FF10F0] text-white hover:bg-[#FF10F0]/90 font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border-none cursor-pointer"
                    >
                      Reschedule Booking
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      disabled={hoursToStart < 4}
                      onClick={() => setConfirmingCancel(true)}
                      className="w-full mt-2 border border-[#121212] text-[#121212] font-bold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-50 hover:text-[#ba1a1a] hover:border-[#ba1a1a] bg-transparent cursor-pointer"
                    >
                      Cancel Booking
                      <X className="w-4 h-4" />
                    </button>
                    {hoursToStart < 4 && (
                      <p className="text-[11px] text-destructive font-semibold mt-1 text-center">
                        Cancellation closed (less than 4 hours remaining)
                      </p>
                    )}
                  </>
                )}

                {isActive && confirmingCancel && (
                  <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50">
                    <p className="text-sm font-semibold text-rose-600 mb-2">Confirm cancellation?</p>
                    <p className="text-xs text-[#4A4A4A] mb-3">This action cannot be undone.</p>
                    {cancelError && (
                      <p className="text-xs font-medium text-rose-500 mb-2">{cancelError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={performCancellation}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-full bg-rose-600 text-white font-label-md hover:opacity-90 transition-all disabled:opacity-50 border-none cursor-pointer"
                      >
                        {cancelling ? "..." : "Yes, Cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmingCancel(false)}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-full border border-[#EDE4EB] font-label-md hover:bg-[#F8F8F8] transition-all bg-white cursor-pointer text-[#121212]"
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                )}

                {isRebookable && (
                  <button
                    onClick={() =>
                      router.push(
                        `/service/${getServiceSlug(booking.serviceType)}?rebook=${booking.id}`
                      )
                    }
                    className="w-full mt-6 bg-[#FF10F0] text-white font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-[#FF10F0]/90 active:scale-95 border-none cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Book Again
                  </button>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
