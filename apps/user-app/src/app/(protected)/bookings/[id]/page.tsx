"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageSquare, RefreshCw, Star, Check, X } from "lucide-react";
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
  rescheduleLogs?: { id: string; createdAt: string }[];
};

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-primary/10 text-primary",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-accent/10 text-accent",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
};

// Desktop colors per service
const desktopServiceTheme: Record<string, { primary: string; heroClass: string; badge: string }> = {
  GROOMING: { primary: "#A7009D", heroClass: "hero-gradient-grooming", badge: "Grooming" },
  VET_ON_CALL: { primary: "#1a47b8", heroClass: "hero-gradient-vet", badge: "Vet on Call" },
  VET_CLINIC: { primary: "#CC7A00", heroClass: "hero-gradient-clinic", badge: "At Clinic" },
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

  const theme = desktopServiceTheme[booking.serviceType] ?? desktopServiceTheme.GROOMING;
  const serviceLabel = theme.badge;

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

  return (
    <AppShell>
      {/* ===== MOBILE VIEW (unchanged) ===== */}
      <div className="md:hidden mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-foreground">
            {booking.serviceType.replace(/_/g, " ").toLowerCase()}
          </h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium capitalize",
              isCancelled
                ? "bg-destructive/10 text-destructive"
                : (isCompleted && isRescheduled)
                ? "bg-purple-100 text-purple-700 border border-purple-200/50"
                : (statusColors[booking.status] ?? "bg-muted text-muted-foreground")
            )}
          >
            {isCancelled
              ? "cancelled"
              : (isCompleted && isRescheduled)
              ? "rescheduled"
              : booking.status.replace(/_/g, " ").toLowerCase()}
          </span>
        </div>
        <p className="mb-6 text-xs font-mono text-muted-foreground">{booking.id}</p>

        <div className="mb-5 space-y-3 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(booking.slotStart), "EEE, d MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {format(new Date(booking.slotStart), "hh:mm a")} -{" "}
              {format(new Date(booking.slotEnd), "hh:mm a")}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5" />
            <span>
              {booking.address?.house || booking.address?.text || "Address unavailable"}
              {booking.address?.area ? `, ${booking.address.area}` : ""}
              {booking.address?.city ? `, ${booking.address.city}` : ""}
            </span>
          </div>

          {booking.pet ? (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pet
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{booking.pet.name}</p>
              <p className="text-xs text-muted-foreground">
                {booking.pet.breed ?? "Mixed"} · {booking.pet.age ?? 0}y ·{" "}
                {booking.pet.weight ?? 0}kg
              </p>
            </div>
          ) : null}
        </div>

        {booking.partner ? (
          <div className="mb-5 rounded-3xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Partner
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{booking.partner.name}</p>
            <p className="text-xs text-muted-foreground">
              {booking.partner.rating ? `${booking.partner.rating} rating` : "Assigned partner"}
              {booking.partner.totalCompleted
                ? ` · ${booking.partner.totalCompleted} completed jobs`
                : ""}
            </p>
          </div>
        ) : null}

        {isActive && !confirmingCancel ? (
          <div className="mb-5 space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Manage booking</h3>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-ask-cano", {
                      detail: { intent: "reschedule", bookingId: booking.id },
                    })
                  );
                }}
                className="flex-1 rounded-full h-11 font-semibold transition-all hover:bg-accent/10 hover:scale-[1.01]"
                variant="outline"
              >
                📅 Reschedule Visit
              </Button>
              <Button
                onClick={() => setConfirmingCancel(true)}
                disabled={hoursToStart < 4}
                className="flex-1 rounded-full h-11 font-semibold bg-rose-500/10 text-rose-600 border border-rose-200 hover:bg-rose-500/20 hover:border-rose-300 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ❌ Cancel Booking
              </Button>
            </div>
            {hoursToStart < 4 && (
              <p className="text-[11px] text-destructive font-medium mt-2 text-center">
                Cancellation closed (less than 4 hours remaining)
              </p>
            )}
          </div>
        ) : null}

        {isActive && confirmingCancel ? (
          <div className="mb-5 space-y-4 rounded-3xl border border-rose-200 bg-rose-500/[0.02] p-5 shadow-sm animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-rose-600 tracking-tight">Confirm cancellation</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              {isFreeCancellation ? (
                <div className="mt-3 rounded-2xl bg-emerald-500/5 border border-emerald-100 p-3">
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    ✨ Free cancellation is available. You will receive a full refund.
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-rose-500/5 border border-rose-100 p-3">
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                    ⚠️ Cancelling now will incur a 20% penalty fee (80% refund).
                  </p>
                </div>
              )}
            </div>
            {cancelError && (
              <p className="text-xs font-medium text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl">{cancelError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={performCancellation}
                disabled={cancelling}
                className="flex-1 rounded-full h-10 font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
              </Button>
              <Button
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelling}
                className="flex-1 rounded-full h-10 font-semibold transition-all"
                variant="outline"
              >
                Keep Booking
              </Button>
            </div>
          </div>
        ) : null}

        {booking.status === "COMPLETED" ? (
          <RateAndReport booking={booking} onUpdated={loadBooking} />
        ) : null}

        {isRebookable ? (
          <Button
            onClick={() =>
              router.push(
                `/service/${getServiceSlug(booking.serviceType)}?rebook=${booking.id}`
              )
            }
            className="mt-5 h-12 w-full rounded-full font-semibold shadow-lg shadow-primary/25"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Book Again
          </Button>
        ) : null}
      </div>

      {/* ===== DESKTOP VIEW (design md) ===== */}
      <div className="hidden md:block" style={{ background: "#F9FAFB" }}>
        <main className="max-w-[1280px] mx-auto px-10 py-8">
          {/* Hero Header */}
          <header className={cn("mb-8 p-8 rounded-xl text-white shadow-lg", theme.heroClass)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white px-4 py-1.5 rounded-full font-label-md flex items-center gap-1 shadow-sm" style={{ color: theme.primary }}>
                {isCancelled || isFailed ? (
                  <><X className="w-3.5 h-3.5" /> {desktopBadgeText}</>
                ) : (
                  <><Check className="w-3.5 h-3.5" /> {desktopBadgeText}</>
                )}
              </span>
            </div>
            <h1 className="font-headline-lg text-white">
              {desktopTitle}
            </h1>
            <p className="text-white/80 font-body-lg">
              {desktopDesc}
            </p>
          </header>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="md:col-span-8 space-y-6">
              {/* Partner Card */}
              {booking.partner && (
                <section className="bg-white rounded-xl p-6 custom-shadow border border-[#d9c0ce]/30 flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 aspect-square bg-[#e2e8f8] rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}CC)` }}>
                      {booking.partner.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-headline-md text-[#151c27]">{booking.partner.name}</h2>
                      </div>
                      <p className="font-semibold mb-2" style={{ color: theme.primary }}>
                        {serviceLabel} Specialist {booking.partner.totalCompleted ? `· ${booking.partner.totalCompleted} sessions` : ""}
                      </p>
                      <div className="flex items-center gap-1 mb-4">
                        <Star className="w-4 h-4 text-amber-500" fill="#f59e0b" />
                        <span className="font-label-md text-[#151c27]">
                          {booking.partner.rating ? booking.partner.rating.toFixed(1) : "—"} ({booking.partner.totalCompleted ?? 0} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#d9c0ce]/30">
                      {booking.partner.phone ? (
                        <>
                          <a
                            href={`tel:${booking.partner.phone}`}
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#f0f3ff] rounded-lg hover:opacity-80 transition-colors text-center"
                            style={{ color: theme.primary }}
                          >
                            <Phone className="w-5 h-5" />
                            <span className="font-label-sm">Call</span>
                          </a>
                          <a
                            href={`sms:${booking.partner.phone}`}
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#f0f3ff] rounded-lg hover:opacity-80 transition-colors text-center"
                            style={{ color: theme.primary }}
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-label-sm">SMS</span>
                          </a>
                          <a
                            href={`https://wa.me/${booking.partner.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#f0f3ff] rounded-lg hover:opacity-80 transition-colors text-center"
                            style={{ color: theme.primary }}
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-label-sm">WhatsApp</span>
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
                <h3 className="font-headline-sm text-[#151c27] px-1">Booking & Payment Summary</h3>
                <div className="bg-white rounded-xl custom-shadow border border-[#d9c0ce]/20 overflow-hidden">
                  <div className="p-4 border-b border-[#d9c0ce]/10 bg-[#f0f3ff]">
                    <h4 className="font-label-md uppercase tracking-wider text-[#54414d]">Payment Information</h4>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <span style={{ color: theme.primary }}>💳</span>
                      <div>
                        <p className="font-body-md font-semibold text-[#151c27]">Pay After Service</p>
                        <p className="font-label-md text-[#54414d]">Cash or UPI after completion · ID: {booking.id.slice(0, 12)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-[#f0f3ff]/50 border-t border-[#d9c0ce]/10">
                    <h4 className="font-label-md uppercase tracking-wider text-[#54414d] mb-4">Price Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between font-body-md">
                        <span>{serviceLabel} Service</span>
                        <span>₹{(booking as any).amount ?? "—"}</span>
                      </div>
                      <div className="flex justify-between font-body-md">
                        <span>Service Fee</span>
                        <span>₹50</span>
                      </div>
                      <div className="flex justify-between font-bold font-headline-sm pt-2 border-t border-[#d9c0ce]/20" style={{ color: theme.primary }}>
                        <span>Total {isPast ? "Paid" : "Due"}</span>
                        <span>₹{((booking as any).amount ?? 0) + 50}</span>
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
              {/* Checklist Card */}
              {!isPast && (
                <section className="p-8 rounded-xl text-white shadow-lg relative overflow-hidden" style={{ background: theme.primary }}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">✅</span>
                      <h3 className="font-headline-sm">Pet Parent Checklist</h3>
                    </div>
                    <div className="space-y-4">
                      {["Secure your pet in a quiet room", "Medical records ready", "No food 2 hours prior"].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="mt-1 w-5 h-5 rounded border-2 border-white/30 bg-white/20 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                          <p className="font-body-md font-bold">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                    <span className="text-[120px]">🐾</span>
                  </div>
                </section>
              )}

              {/* Appointment Details */}
              <section className="bg-white p-6 rounded-xl border border-[#d9c0ce]/30">
                <h3 className="font-label-md uppercase tracking-wider text-[#54414d] mb-4">Appointment Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#d9c0ce]/10">
                    <span className="text-[#54414d]">Time</span>
                    <span className="font-bold text-[#151c27]">
                      {format(new Date(booking.slotStart), "hh:mm a")} - {format(new Date(booking.slotEnd), "hh:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#d9c0ce]/10">
                    <span className="text-[#54414d]">Date</span>
                    <span className="font-bold text-[#151c27]">
                      {format(new Date(booking.slotStart), "EEE, d MMM yyyy")}
                    </span>
                  </div>
                  {booking.pet && (
                    <div className="flex justify-between items-center py-2 border-b border-[#d9c0ce]/10">
                      <span className="text-[#54414d]">Pet Profile</span>
                      <span className="font-bold text-[#151c27]">{booking.pet.name} ({booking.pet.breed ?? "Mixed"})</span>
                    </div>
                  )}
                  {booking.address && (
                    <div className="flex justify-between items-center py-2 border-b border-[#d9c0ce]/10">
                      <span className="text-[#54414d]">Address</span>
                      <span className="font-bold text-[#151c27] text-right text-sm">
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
                      className="w-full mt-6 text-white hover:opacity-90 font-headline-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
                      style={{ background: theme.primary }}
                    >
                      Reschedule Booking
                      <Calendar className="w-5 h-5" />
                    </button>
                    <button
                      disabled={hoursToStart < 4}
                      onClick={() => setConfirmingCancel(true)}
                      className="w-full mt-2 text-[#54414d] hover:text-[#ba1a1a] font-label-md py-2 rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:text-[#54414d] disabled:cursor-not-allowed"
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
                    <p className="text-xs text-[#54414d] mb-3">This action cannot be undone.</p>
                    {cancelError && (
                      <p className="text-xs font-medium text-rose-500 mb-2">{cancelError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={performCancellation}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-full bg-rose-600 text-white font-label-md hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {cancelling ? "..." : "Yes, Cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmingCancel(false)}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-full border border-[#d9c0ce] font-label-md hover:bg-[#f0f3ff] transition-all"
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
                    className="w-full mt-6 text-white font-headline-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
                    style={{ background: theme.primary }}
                  >
                    <RefreshCw className="w-5 h-5" />
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
