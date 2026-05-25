import { differenceInDays } from "date-fns";

export type FollowUpKind = "vaccination" | "results" | "checkup";

export interface BookingForFollowUp {
  id: string;
  serviceType: string;
  status: string;
  slotStart: string;
  pet?: { id: string; name: string; type: string };
}

export interface FollowUp {
  id: string;
  kind: FollowUpKind;
  title: string;
  body: string;
  bookingId: string;
  ctaLabel: string;
  emoji: string;
  createdAt: string;
}

export function deriveFollowUps(bookings: BookingForFollowUp[]): FollowUp[] {
  const out: FollowUp[] = [];
  const now = new Date();

  bookings.forEach((booking) => {
    if (booking.status !== "COMPLETED") {
      return;
    }

    const slotDate = new Date(booking.slotStart);
    const days = differenceInDays(now, slotDate);
    const petName = booking.pet?.name ?? "your pet";

    if (booking.serviceType === "VET_CLINIC" && days >= 2 && days <= 14) {
      out.push({
        id: `fu-results-${booking.id}`,
        kind: "results",
        title: `Clinic notes for ${petName} are ready`,
        body: "Open the booking to review the visit and next steps.",
        bookingId: booking.id,
        ctaLabel: "View details",
        emoji: "Results",
        createdAt: new Date(slotDate.getTime() + 3 * 86400000).toISOString(),
      });
    }

    if (booking.serviceType === "VET_ON_CALL" && days >= 25) {
      out.push({
        id: `fu-checkup-${booking.id}`,
        kind: "checkup",
        title: `Time for ${petName}'s follow-up checkup`,
        body: `It has been ${days} days since the last home visit.`,
        bookingId: booking.id,
        ctaLabel: "Book follow-up",
        emoji: "Checkup",
        createdAt: now.toISOString(),
      });
    }

    if (booking.serviceType === "GROOMING" && days >= 30) {
      out.push({
        id: `fu-grooming-${booking.id}`,
        kind: "vaccination",
        title: `${petName} may be due for the next grooming session`,
        body: "Rebook the same service from your previous visit.",
        bookingId: booking.id,
        ctaLabel: "Book again",
        emoji: "Grooming",
        createdAt: now.toISOString(),
      });
    }
  });

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
