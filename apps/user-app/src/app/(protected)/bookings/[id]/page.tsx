"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, RefreshCw } from "lucide-react";
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
  partner?: { id: string; name: string; rating?: number; totalCompleted?: number };
  review?: { id: string; rating: number; comment?: string | null } | null;
  complaints?: { id: string; message: string; status: string }[];
};

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-primary/10 text-primary",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-accent/10 text-accent",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
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
  const slotStart = new Date(booking.slotStart);
  const hoursToStart = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
  const isFreeCancellation = hoursToStart >= 8;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6">
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
              statusColors[booking.status] ?? "bg-muted text-muted-foreground"
            )}
          >
            {booking.status.replace(/_/g, " ").toLowerCase()}
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
                className="flex-1 rounded-full h-11 font-semibold bg-rose-500/10 text-rose-600 border border-rose-200 hover:bg-rose-500/20 hover:border-rose-300 transition-all hover:scale-[1.01] active:scale-95"
              >
                ❌ Cancel Booking
              </Button>
            </div>
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
    </AppShell>
  );
}
