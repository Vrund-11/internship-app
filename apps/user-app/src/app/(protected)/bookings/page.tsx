"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Bell, Calendar, Clock, Loader2, MapPin, RefreshCw } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { api } from "@/lib/api";
import {
  deriveFollowUps,
  type BookingForFollowUp,
} from "@/features/bookings/lib/followUps";
import { getServiceSlug } from "@/features/home/data/services";

type BookingItem = BookingForFollowUp & {
  createdAt: string;
  slotEnd: string;
  address?: { id: string; text: string; label?: string; area?: string; city?: string };
  partner?: { id: string; name: string; rating?: number; totalCompleted?: number };
  review?: { id: string; rating: number; comment?: string | null } | null;
  complaints?: { id: string; message: string; status: string }[];
  amount?: number;
};

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-primary/10 text-primary",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-accent/10 text-accent",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  CONFIRMED: "Upcoming",
  AWAITING_PAYMENT: "Awaiting Payment",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const serviceEmoji: Record<string, string> = {
  GROOMING: "Grooming",
  VET_ON_CALL: "Vet",
  VET_CLINIC: "Clinic",
};

type TabKey = "upcoming" | "past" | "followups";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 6;

  const loadBookings = async (nextPage: number, append: boolean) => {
    try {
      const res = await api.get("/booking/history", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const nextBookings = (res.data.bookings ?? []) as BookingItem[];
      setHasMore(Boolean(res.data.hasMore));
      setPage(nextPage);
      setBookings((prev) => (append ? [...prev, ...nextBookings] : nextBookings));

      if (!append) {
        const nextFollowUps = deriveFollowUps(nextBookings);
        if (nextFollowUps.length > 0) {
          setActiveTab("followups");
        }
      }
    } catch {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadBookings(1, false);
  }, []);

  const { upcoming, past } = useMemo(() => {
    const nextUpcoming: BookingItem[] = [];
    const nextPast: BookingItem[] = [];

    bookings.forEach((booking) => {
      if (
        booking.status === "CONFIRMED" ||
        booking.status === "AWAITING_PAYMENT" ||
        booking.status === "IN_PROGRESS"
      ) {
        nextUpcoming.push(booking);
      } else {
        nextPast.push(booking);
      }
    });

    return { upcoming: nextUpcoming, past: nextPast };
  }, [bookings]);

  const followUps = useMemo(() => deriveFollowUps(bookings), [bookings]);

  const formatSlotTime = (slotStart: string, slotEnd: string) => {
    try {
      const start = new Date(slotStart);
      const end = new Date(slotEnd);
      const fmt = (date: Date) =>
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return `${fmt(start)} - ${fmt(end)}`;
    } catch {
      return "-";
    }
  };

  const renderBookingCard = (booking: BookingItem, index: number, showRebook: boolean) => (
    <div
      key={booking.id}
      className="bg-card rounded-3xl border border-border p-4 shadow-card animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
            {serviceEmoji[booking.serviceType] ?? "Service"}
          </span>
          <h3 className="text-sm font-semibold capitalize text-foreground">
            {booking.serviceType.replace(/_/g, " ").toLowerCase()}
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-medium capitalize",
            statusColors[booking.status] ?? "bg-muted text-muted-foreground"
          )}
        >
          {statusLabels[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(booking.slotStart), "EEE, d MMM yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatSlotTime(booking.slotStart, booking.slotEnd)}</span>
        </div>
        {booking.address ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>
              {booking.address.area ? `${booking.address.area}, ` : ""}
              {booking.address.city || booking.address.text}
            </span>
          </div>
        ) : null}
      </div>

      {booking.partner ? (
        <div className="mb-3 rounded-2xl bg-secondary/60 px-3 py-2">
          <p className="text-xs font-semibold text-foreground">{booking.partner.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {booking.partner.rating ? `${booking.partner.rating} rating` : "Assigned partner"}
            {booking.partner.totalCompleted
              ? ` · ${booking.partner.totalCompleted} jobs`
              : ""}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-1.5">
          {booking.pet ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {booking.pet.type === "cat" ? "Cat" : "Dog"} {booking.pet.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          className="flex-1 rounded-full text-xs"
        >
          View Details
        </Button>
        {showRebook ? (
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/service/${getServiceSlug(booking.serviceType)}?rebook=${booking.id}`
              )
            }
            className="flex-1 rounded-full text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Book Again
          </Button>
        ) : null}
      </div>
    </div>
  );

  const renderEmpty = (text: string) => (
    <div className="py-12 text-center">
      <span className="mb-4 block text-5xl">📭</span>
      <p className="font-medium text-foreground">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Book a service for your pet to get started.
      </p>
    </div>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 font-serif text-xl text-foreground lg:text-2xl">My Bookings</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          Track your pet care appointments.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}

        {error && !loading ? (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="mb-4 grid grid-cols-3 rounded-full bg-muted p-1">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === "upcoming"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === "past"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                Past ({past.length})
              </button>
              <button
                onClick={() => setActiveTab("followups")}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === "followups"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  For You ({followUps.length})
                </span>
              </button>
            </div>

            {activeTab === "upcoming" ? (
              upcoming.length === 0 ? (
                renderEmpty("No upcoming bookings yet.")
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {upcoming.map((booking, index) =>
                    renderBookingCard(booking, index, false)
                  )}
                </div>
              )
            ) : null}

            {activeTab === "past" ? (
              past.length === 0 ? (
                renderEmpty("No past bookings yet.")
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {past.map((booking, index) =>
                    renderBookingCard(booking, index, true)
                  )}
                </div>
              )
            ) : null}

            {activeTab === "followups" ? (
              followUps.length === 0 ? (
                renderEmpty("No reminders right now.")
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {followUps.map((followUp, index) => (
                    <div
                      key={followUp.id}
                      className="bg-card rounded-3xl border border-border p-4 animate-fade-in-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-xs font-semibold">
                          {followUp.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {followUp.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {followUp.body}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/bookings/${followUp.bookingId}`)}
                        className="w-full rounded-full text-xs"
                      >
                        {followUp.ctaLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : null}

            {hasMore ? (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoadingMore(true);
                    loadBookings(page + 1, true);
                  }}
                  disabled={loadingMore}
                  className="rounded-full"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
