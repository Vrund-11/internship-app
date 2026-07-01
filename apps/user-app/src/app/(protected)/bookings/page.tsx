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

const serviceLabelsMap: Record<string, string> = {
  GROOMING: "Grooming",
  VET_ON_CALL: "Vet on Call",
  VET_CLINIC: "At Clinic",
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
  const PAGE_SIZE = 20;

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

  /* ===== MOBILE CARD (redesigned) ===== */
  const renderMobileBookingCard = (booking: BookingItem, index: number, showRebook: boolean) => {
    const getMobileStatusBadgeClass = (status: string, rescheduleLogsExist: boolean) => {
      if (status === "CANCELLED") return "bg-rose-500/10 text-rose-600 border border-rose-200/30";
      if (status === "COMPLETED" && rescheduleLogsExist) return "bg-purple-100 text-purple-700 border border-purple-200/50";
      if (status === "COMPLETED") return "bg-gray-100 text-gray-500 border border-gray-200/30";
      if (status === "CONFIRMED") return "bg-[#FFF0FC] text-[#FF10F0] border border-[#FF10F0]/20";
      if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-700 border border-amber-200/30";
      return "bg-yellow-100 text-yellow-700 border border-yellow-200/30";
    };

    return (
      <div
        key={booking.id}
        className="bg-white rounded-3xl border border-border p-4 shadow-card animate-fade-in-up"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] rounded-full bg-[#FFF0FC] px-2.5 py-1 font-bold text-[#FF10F0]">
              {serviceEmoji[booking.serviceType] ?? "Service"}
            </span>
            <h3 className="text-sm font-extrabold capitalize text-[#121212]">
              {booking.serviceType.replace(/_/g, " ").toLowerCase()}
            </h3>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
              getMobileStatusBadgeClass(booking.status, Boolean(booking.rescheduleLogs && booking.rescheduleLogs.length > 0))
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
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A] font-medium">
            <Calendar className="h-3.5 w-3.5 text-[#FF10F0]" />
            <span>{format(new Date(booking.slotStart), "EEE, d MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4A4A4A] font-medium">
            <Clock className="h-3.5 w-3.5 text-[#FF10F0]" />
            <span>{formatSlotTime(booking.slotStart, booking.slotEnd)}</span>
          </div>
          {booking.address ? (
            <div className="flex items-center gap-2 text-xs text-[#4A4A4A] font-medium">
              <MapPin className="h-3.5 w-3.5 text-[#FF10F0]" />
              <span className="truncate">
                {booking.address.area ? `${booking.address.area}, ` : ""}
                {booking.address.city || booking.address.text}
              </span>
            </div>
          ) : null}
        </div>

        {booking.partner ? (
          <div className="mb-3 rounded-2xl bg-[#F8F8F8] px-3 py-2 border border-border">
            <p className="text-xs font-bold text-[#121212]">{booking.partner.name}</p>
            <p className="text-[10px] text-[#4A4A4A] mt-0.5">
              {booking.partner.rating ? `⭐ ${booking.partner.rating} rating` : "Assigned partner"}
              {booking.partner.totalCompleted
                ? ` · ${booking.partner.totalCompleted} jobs`
                : ""}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex gap-1.5">
            {booking.pet ? (
              <span className="rounded-full bg-[#F8F8F8] border border-border px-2.5 py-0.5 text-xs text-[#4A4A4A] font-bold">
                {booking.pet.type === "cat" ? "🐈" : "🐕"} {booking.pet.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/bookings/${booking.id}`)}
            className="flex-1 rounded-full text-xs font-bold border-[#4A4A4A]/20 text-[#4A4A4A] hover:bg-[#F8F8F8]"
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
              className="flex-1 rounded-full text-xs font-bold bg-[#FF10F0] text-white hover:bg-[#FF10F0]/90 border-none shadow-sm active:scale-[0.98]"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Book Again
            </Button>
          ) : null}
        </div>
        {booking.status === "COMPLETED" && (
          <div className="mt-2 flex gap-2">
            {booking.review ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="flex-1 rounded-full text-xs font-bold bg-[#F8F8F8] text-[#4A4A4A]/60 border border-[#EDE4EB]"
              >
                ★ Reviewed
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-ask-cano", {
                      detail: { intent: "review", bookingId: booking.id },
                    })
                  );
                }}
                className="flex-1 rounded-full text-xs font-bold bg-[#FFF0FC] text-[#FF10F0] hover:bg-[#FFF0FC]/80 border border-[#FF10F0]/20 active:scale-[0.98]"
              >
                ★ Review
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-cano", {
                    detail: { intent: "complain", bookingId: booking.id },
                  })
                );
              }}
              className="flex-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/50 active:scale-[0.98]"
            >
              🚩 Complain
            </Button>
          </div>
        )}
      </div>
    );
  };

  /* ===== DESKTOP CARD (Design MD — unified palette) ===== */
  const renderDesktopBookingCard = (booking: BookingItem, index: number, isPast: boolean) => {
    const serviceLabel = serviceLabelsMap[booking.serviceType] ?? "Service";

    return (
      <div
        key={booking.id}
        className={cn(
          "bg-white rounded-xl border border-[#EDE4EB] overflow-hidden flex flex-col h-full desktop-card-hover transition-all duration-300",
          isPast && "opacity-80"
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Service chip + Status */}
          <div className="flex justify-between items-start">
            <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border border-[#EDE4EB] bg-[#F8F8F8] text-[#4A4A4A]">
              {serviceLabel}
            </span>
            {isPast && (
              <>
                {booking.status === "CANCELLED" ? (
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-full uppercase tracking-wider border border-rose-300/30">
                    Cancelled
                  </span>
                ) : booking.status === "FAILED" ? (
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-full uppercase tracking-wider border border-rose-300/30">
                    Failed
                  </span>
                ) : (booking.rescheduleLogs && booking.rescheduleLogs.length > 0) ? (
                  <span className="px-2.5 py-0.5 bg-[#FFF0FC] text-[#FF10F0] text-xs font-bold rounded-full uppercase tracking-wider border border-[#FF10F0]/20">
                    Rescheduled
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200/50">
                    Completed
                  </span>
                )}
              </>
            )}
            {!isPast && (
              <span className="px-2.5 py-0.5 bg-[#FFF0FC] text-[#FF10F0] text-xs font-bold rounded-full uppercase tracking-wider border border-[#FF10F0]/20">
                {booking.status === "IN_PROGRESS" ? "In Progress" : "Upcoming"}
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            <h3 className="font-headline-sm text-[#121212] mb-0.5">
              {booking.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
            <p className="font-body-md text-[#4A4A4A]">
              {booking.partner?.name || "Partner pending"}
            </p>
          </div>

          {/* Date + Time */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#4A4A4A]">
              <Calendar className="w-4 h-4 text-[#FF10F0]" />
              <span className="font-body-md">{format(new Date(booking.slotStart), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4A4A4A]">
              <Clock className="w-4 h-4 text-[#FF10F0]" />
              <span className="font-body-md">{formatSlotTime(booking.slotStart, booking.slotEnd)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-[#EDE4EB] bg-[#F8F8F8] flex justify-between items-center gap-2">
          <span className="font-bold text-sm text-[#121212] shrink-0">
            {booking.amount ? `₹${booking.amount}` : "—"}
          </span>
          <div className="flex gap-2">
            {booking.status === "COMPLETED" && (
              <div className="flex gap-2">
                {booking.review ? (
                  <span className="px-3 py-2 text-xs font-bold rounded-full border border-[#EDE4EB] bg-[#F8F8F8] text-[#4A4A4A]/60 flex items-center">
                    ★ Reviewed
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open-ask-cano", {
                          detail: { intent: "review", bookingId: booking.id },
                        })
                      );
                    }}
                    className="pill-button border border-[#FF10F0]/30 text-[#FF10F0] bg-[#FFF0FC] hover:bg-[#FFF0FC]/80 px-3 py-2 font-label-md flex items-center gap-1.5 active:scale-95 transition-all text-xs font-bold cursor-pointer"
                  >
                    ★ Review
                  </button>
                )}
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-ask-cano", {
                        detail: { intent: "complain", bookingId: booking.id },
                      })
                    );
                  }}
                  className="pill-button border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 font-label-md flex items-center gap-1.5 active:scale-95 transition-all text-xs font-bold cursor-pointer"
                >
                  🚩 Complain
                </button>
              </div>
            )}
            <button
              onClick={() => router.push(`/bookings/${booking.id}`)}
              className="pill-button bg-[#FF10F0] text-white px-4 py-2 font-label-md flex items-center gap-2 hover:bg-[#FF10F0]/90 active:scale-95 transition-all text-xs font-bold"
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
            <div className="mb-4 grid grid-cols-3 rounded-full bg-[#EDE4EB]/40 p-1">
              {desktopTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-white text-[#FF10F0] font-bold shadow-sm"
                      : "text-[#4A4A4A] hover:text-[#FF10F0]"
                  )}
                >
                  {tab.key === "followups" ? (
                    <span className="inline-flex items-center gap-1 justify-center w-full">
                      <Bell className="h-3.5 w-3.5" />
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
                      className="bg-white rounded-3xl border border-border p-4 shadow-card animate-fade-in-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FFF0FC] text-xs font-semibold">
                          {followUp.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-[#121212]">
                            {followUp.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[#4A4A4A] font-semibold">
                            {followUp.body}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/bookings/${followUp.bookingId}`)}
                        className="w-full rounded-full text-xs font-bold bg-[#FF10F0] text-white hover:bg-[#FF10F0]/90 border-none shadow-sm active:scale-[0.98]"
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
      <div className="hidden md:block" style={{ background: "#F8F8F8" }}>
        <main className="max-w-[1280px] mx-auto px-10 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-headline-lg text-[#121212] mb-1">My Bookings</h1>
            <p className="font-body-lg text-[#4A4A4A]">Manage your pet&apos;s healthcare journey and upcoming appointments.</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#EDE4EB] mb-8 overflow-x-auto no-scrollbar">
            {desktopTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-6 py-4 font-label-md whitespace-nowrap transition-colors",
                  activeTab === tab.key
                    ? "border-b-2 border-[#FF10F0] text-[#FF10F0] font-extrabold"
                    : "text-[#4A4A4A] hover:text-[#FF10F0] font-semibold"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF10F0]" />
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
                    <p className="font-headline-sm text-[#121212]">No upcoming bookings yet.</p>
                    <p className="mt-1 font-body-md text-[#4A4A4A]">Book a service for your pet to get started.</p>
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
                    <p className="font-headline-sm text-[#121212]">No past bookings yet.</p>
                    <p className="mt-1 font-body-md text-[#4A4A4A]">Your completed bookings will appear here.</p>
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
                    <p className="font-headline-sm text-[#121212]">No reminders right now.</p>
                    <p className="mt-1 font-body-md text-[#4A4A4A]">We&apos;ll notify you when follow-ups are due.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {followUps.map((followUp, index) => (
                      <div key={followUp.id} className="md:col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-xl custom-shadow desktop-card-hover transition-all duration-300 overflow-hidden p-6 border border-[#EDE4EB]">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffd7f0] text-lg">
                              {followUp.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-headline-sm text-[#121212]">{followUp.title}</p>
                              <p className="mt-0.5 font-body-md text-[#4A4A4A]">{followUp.body}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/bookings/${followUp.bookingId}`)}
                            className="w-full pill-button bg-[#FF10F0] text-white py-2.5 font-label-md hover:bg-[#FF10F0]/90 active:scale-95 transition-all"
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
                    className="pill-button border border-[#121212] text-[#121212] px-8 py-3 font-bold hover:bg-[#121212] hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}

              {/* Support Section */}
              <div className="mt-8 p-8 bg-[#F8F8F8] border border-[#EDE4EB] rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h4 className="font-headline-sm text-[#121212]">Need help with a booking?</h4>
                  <p className="font-body-md text-[#4A4A4A]">Our support team is available 24/7 for urgent care inquiries.</p>
                </div>
                <button className="pill-button border border-[#121212] text-[#121212] px-8 py-3 font-bold hover:bg-[#121212] hover:text-white transition-all active:scale-95">
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

