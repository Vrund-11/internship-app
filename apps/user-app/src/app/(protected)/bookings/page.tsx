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

// Desktop: service-specific colors
const serviceDesktopColors: Record<string, { border: string; badge: string; badgeText: string; icon: string; bgTint: string }> = {
  GROOMING: {
    border: "border-[#FF10F0]/20",
    badge: "bg-[#FF10F0]/10 border-[#FF10F0]/30",
    badgeText: "text-[#FF10F0]",
    icon: "text-[#FF10F0]",
    bgTint: "bg-[#FF10F0]/10",
  },
  VET_ON_CALL: {
    border: "border-[#0047AB]/20",
    badge: "bg-[#0047AB]/10 border-[#0047AB]/30",
    badgeText: "text-[#0047AB]",
    icon: "text-[#0047AB]",
    bgTint: "bg-[#0047AB]/10",
  },
  VET_CLINIC: {
    border: "border-[#FF8C00]/20",
    badge: "bg-[#FF8C00]/10 border-[#FF8C00]/30",
    badgeText: "text-[#FF8C00]",
    icon: "text-[#FF8C00]",
    bgTint: "bg-[#FF8C00]/10",
  },
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

  /* ===== MOBILE CARD (unchanged) ===== */
  const renderMobileBookingCard = (booking: BookingItem, index: number, showRebook: boolean) => (
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
            booking.status === "CANCELLED"
              ? "bg-destructive/10 text-destructive"
              : (booking.status === "COMPLETED" && booking.rescheduleLogs && booking.rescheduleLogs.length > 0)
              ? "bg-purple-100 text-purple-700 border border-purple-200/50"
              : (statusColors[booking.status] ?? "bg-muted text-muted-foreground")
          )}
        >
          {booking.status === "CANCELLED"
            ? "Cancelled"
            : (booking.status === "COMPLETED" && booking.rescheduleLogs && booking.rescheduleLogs.length > 0)
            ? "Rescheduled"
            : (statusLabels[booking.status] ?? booking.status)}
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
      <div className="mt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("open-ask-cano", {
                detail: { intent: "feedback", bookingId: booking.id },
              })
            );
          }}
          className="w-full rounded-full text-xs bg-[rgba(167,0,157,0.06)] text-primary hover:bg-[rgba(167,0,157,0.1)] border border-primary/10"
        >
          Review or Complain?
        </Button>
      </div>
    </div>
  );

  /* ===== DESKTOP CARD (new design md) ===== */
  const renderDesktopBookingCard = (booking: BookingItem, index: number, isPast: boolean) => {
    const colors = serviceDesktopColors[booking.serviceType] ?? serviceDesktopColors.GROOMING;
    const serviceLabel = booking.serviceType === "VET_ON_CALL" ? "Vet on Call" : booking.serviceType === "VET_CLINIC" ? "At Clinic" : "Grooming";

    return (
      <div
        key={booking.id}
        className={cn(
          "bg-white rounded-xl custom-shadow hover-shadow transition-all duration-300 overflow-hidden flex flex-col h-full border-2",
          colors.border,
          isPast && "opacity-80"
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Badge + Icon */}
          <div className="flex justify-between items-start">
            <span className={cn("px-3 py-1 font-label-sm rounded-full uppercase tracking-wider border", colors.badge, colors.badgeText)}>
              {serviceLabel}
            </span>
            {isPast && (
              <>
                {booking.status === "CANCELLED" ? (
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 font-label-sm rounded-full uppercase tracking-wider border border-rose-300/30">
                    Cancelled
                  </span>
                ) : booking.status === "FAILED" ? (
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 font-label-sm rounded-full uppercase tracking-wider border border-rose-300/30">
                    Failed
                  </span>
                ) : (booking.rescheduleLogs && booking.rescheduleLogs.length > 0) ? (
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 font-label-sm rounded-full uppercase tracking-wider border border-purple-300/30">
                    Rescheduled
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] font-label-sm rounded-full uppercase tracking-wider border border-[#22c55e]/30">
                    Completed
                  </span>
                )}
              </>
            )}
          </div>

          {/* Details */}
          <div>
            <h3 className="font-headline-sm text-[#151c27] mb-1">
              {booking.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
            <p className="font-body-md text-[#54414d]">
              {booking.partner?.name || "Partner pending"}
            </p>
          </div>

          {/* Date + Time */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2 text-[#54414d]">
              <Calendar className="w-4 h-4" />
              <span className="font-body-md">{format(new Date(booking.slotStart), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#54414d]">
              <Clock className="w-4 h-4" />
              <span className="font-body-md">{formatSlotTime(booking.slotStart, booking.slotEnd)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn("mt-auto p-4 border-t border-[#d9c0ce] flex justify-between items-center gap-2", colors.bgTint)}>
          <span className="font-label-md text-[#54414d] shrink-0">
            {booking.amount ? `₹${booking.amount}` : "-"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-cano", {
                    detail: { intent: "feedback", bookingId: booking.id },
                  })
                );
              }}
              className="pill-button border border-[#6c005f] text-[#6c005f] hover:bg-[#6c005f]/5 px-3 py-2 font-label-md flex items-center gap-2 active:scale-95 transition-all bg-transparent"
            >
              Review or Complain
            </button>
            <button
              onClick={() => router.push(`/bookings/${booking.id}`)}
              className="pill-button bg-[#6c005f] text-white px-4 py-2 font-label-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmpty = (text: string) => (
    <div className="py-12 text-center">
      <span className="mb-4 block text-5xl">📭</span>
      <p className="font-medium text-foreground">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Book a service for your pet to get started.
      </p>
    </div>
  );

  const desktopTabs: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: past.length },
    { key: "followups", label: "For You", count: followUps.length },
  ];

  return (
    <AppShell>
      {/* ===== MOBILE VIEW (unchanged) ===== */}
      <div className="md:hidden mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 font-bold text-xl text-foreground lg:text-2xl">My Bookings</h1>
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
              {desktopTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                    activeTab === tab.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {tab.key === "followups" ? (
                    <span className="inline-flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      For You ({tab.count})
                    </span>
                  ) : (
                    `${tab.label} (${tab.count})`
                  )}
                </button>
              ))}
            </div>

            {activeTab === "upcoming" ? (
              upcoming.length === 0 ? (
                renderEmpty("No upcoming bookings yet.")
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {upcoming.map((booking, index) =>
                    renderMobileBookingCard(booking, index, false)
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
                    renderMobileBookingCard(booking, index, true)
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

      {/* ===== DESKTOP VIEW (design md) ===== */}
      <div className="hidden md:block" style={{ background: "#F9FAFB" }}>
        <main className="max-w-[1280px] mx-auto px-10 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-headline-lg text-[#151c27] mb-1">My Bookings</h1>
            <p className="font-body-lg text-[#54414d]">Manage your pet&apos;s healthcare journey and upcoming appointments.</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#d9c0ce] mb-8 overflow-x-auto no-scrollbar">
            {desktopTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-6 py-4 font-label-md whitespace-nowrap transition-colors",
                  activeTab === tab.key
                    ? "border-b-2 border-[#6c005f] text-[#6c005f]"
                    : "text-[#54414d] hover:text-[#6c005f]"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#6c005f]" />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <>
              {/* Bookings Grid */}
              {activeTab === "upcoming" ? (
                upcoming.length === 0 ? (
                  <div className="py-16 text-center">
                    <span className="mb-4 block text-5xl">📭</span>
                    <p className="font-headline-sm text-[#151c27]">No upcoming bookings yet.</p>
                    <p className="mt-1 font-body-md text-[#54414d]">Book a service for your pet to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {upcoming.map((booking, index) => (
                      <div key={booking.id} className="md:col-span-12 lg:col-span-4">
                        {renderDesktopBookingCard(booking, index, false)}
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {activeTab === "past" ? (
                past.length === 0 ? (
                  <div className="py-16 text-center">
                    <span className="mb-4 block text-5xl">📭</span>
                    <p className="font-headline-sm text-[#151c27]">No past bookings yet.</p>
                    <p className="mt-1 font-body-md text-[#54414d]">Your completed bookings will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {past.map((booking, index) => (
                      <div key={booking.id} className="md:col-span-12 lg:col-span-4">
                        {renderDesktopBookingCard(booking, index, true)}
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {activeTab === "followups" ? (
                followUps.length === 0 ? (
                  <div className="py-16 text-center">
                    <span className="mb-4 block text-5xl">📭</span>
                    <p className="font-headline-sm text-[#151c27]">No reminders right now.</p>
                    <p className="mt-1 font-body-md text-[#54414d]">We&apos;ll notify you when follow-ups are due.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {followUps.map((followUp, index) => (
                      <div key={followUp.id} className="md:col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-xl custom-shadow hover-shadow transition-all duration-300 overflow-hidden p-6 border border-[#d9c0ce]/30">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffd7f0] text-lg">
                              {followUp.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-headline-sm text-[#151c27]">{followUp.title}</p>
                              <p className="mt-0.5 font-body-md text-[#54414d]">{followUp.body}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/bookings/${followUp.bookingId}`)}
                            className="w-full pill-button bg-[#6c005f] text-white py-2.5 font-label-md hover:opacity-90 active:scale-95 transition-all"
                          >
                            {followUp.ctaLabel}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      setLoadingMore(true);
                      loadBookings(page + 1, true);
                    }}
                    disabled={loadingMore}
                    className="pill-button border-2 border-[#6c005f] text-[#6c005f] px-8 py-3 font-label-md hover:bg-[#6c005f] hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}

              {/* Support Section */}
              <div className="mt-8 p-8 bg-[#f0f3ff] rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h4 className="font-headline-sm text-[#151c27]">Need help with a booking?</h4>
                  <p className="font-body-md text-[#54414d]">Our support team is available 24/7 for urgent care inquiries.</p>
                </div>
                <button className="pill-button border-2 border-[#6c005f] text-[#6c005f] px-8 py-3 font-label-md hover:bg-[#6c005f] hover:text-white transition-all active:scale-95">
                  Contact Support
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
