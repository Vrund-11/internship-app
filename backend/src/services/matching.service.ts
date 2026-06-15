import { prisma } from "../utils/prisma";
import { BookingStatus } from "@canovet/shared";
import { getDistanceKm } from "../utils/geo";

// ── Types ──

type BookingForMatching = {
  id: string;
  cityId: string;
  serviceType: string;
  slotStart: Date;
  slotEnd: Date;
  addressId: string;
};

// ── Constants ──

const MAX_DISTANCE_KM = 10;

// ── Weights for scoring (lower = better) ──

const WEIGHT_DISTANCE = 1;
const WEIGHT_ACTIVE_BOOKINGS = 2;
const WEIGHT_TODAY_COMPLETED = 1;

// ── Helpers ──

const hasScheduleConflict = async (
  partnerId: string,
  slotStart: Date,
  slotEnd: Date
) => {
  const conflict = await prisma.booking.findFirst({
    where: {
      partnerId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
      },
      slotStart: {
        lt: slotEnd,
      },
      slotEnd: {
        gt: slotStart,
      },
    },
    select: { id: true },
  });

  return Boolean(conflict);
};

// ── Service ──

export const matchingService = {
  async assignPartner(booking: BookingForMatching, preferredPartnerId?: string) {
    console.log("AUTO_MATCH_START:", booking.id);

    let lat = 23.0225;
    let lng = 72.5714;
    let addressFound = false;

    if (booking.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: booking.addressId },
        select: { latitude: true, longitude: true },
      });
      if (address) {
        lat = address.latitude;
        lng = address.longitude;
        addressFound = true;
      }
    }

    const isGrooming = booking.serviceType === "GROOMING";

    if (!addressFound && isGrooming) {
      console.log("ADDRESS_NOT_FOUND");

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.FAILED },
      });

      return null;
    }

    if (preferredPartnerId) {
      const preferred = await prisma.partner.findUnique({
        where: { id: preferredPartnerId },
        include: { services: true },
      });

      if (preferred) {
        const hasService = preferred.services.some(
          (service) => service.serviceType === booking.serviceType
        );

        const distance = getDistanceKm(
          lat,
          lng,
          preferred.latitude,
          preferred.longitude
        );

        const isEligible =
          preferred.isOnline &&
          preferred.isVerified &&
          preferred.cityId === booking.cityId &&
          hasService &&
          (!isGrooming || distance <= MAX_DISTANCE_KM);

        if (isEligible) {
          const conflict = await hasScheduleConflict(
            preferred.id,
            booking.slotStart,
            booking.slotEnd
          );

          if (!conflict) {
            console.log("ASSIGNED_PREFERRED_PARTNER:", preferred.id);

            await prisma.booking.update({
              where: { id: booking.id },
              data: {
                partnerId: preferred.id,
                status: BookingStatus.AWAITING_PAYMENT,
              },
            });

            await prisma.partner.update({
              where: { id: preferred.id },
              data: {
                activeBookings: { increment: 1 },
              },
            });

            return preferred;
          }
        }
      }
    }

    // ── 1. Filter by city + service ──

    const partners = await prisma.partner.findMany({
      where: {
        isOnline: true,
        isVerified: true,
        cityId: booking.cityId,
      },
      include: {
        services: true,
      },
    });

    const eligible = partners.filter((partner) =>
      partner.services.some(
        (service) => service.serviceType === booking.serviceType
      )
    );

    console.log(`  eligible (city+service): ${eligible.length}`);

    // ── 2. Filter by time availability ──

    const partnerIds = eligible.map((p) => p.id);
    const conflicts = partnerIds.length > 0
      ? await prisma.booking.findMany({
          where: {
            partnerId: { in: partnerIds },
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
            },
            slotStart: {
              lt: booking.slotEnd,
            },
            slotEnd: {
              gt: booking.slotStart,
            },
          },
          select: { partnerId: true },
        })
      : [];

    const conflictingPartnerIds = new Set(conflicts.map((c) => c.partnerId));
    const availablePartners = eligible.filter(
      (partner) => !conflictingPartnerIds.has(partner.id)
    );

    console.log(`  available (time-free): ${availablePartners.length}`);

    // ── 3. Filter by distance radius (Only for GROOMING) ──

    const nearby = availablePartners.filter((partner) => {
      const distance = getDistanceKm(
        lat,
        lng,
        partner.latitude,
        partner.longitude
      );

      console.log(`  distance ${partner.name}: ${distance.toFixed(2)} km`);

      return !isGrooming || distance <= MAX_DISTANCE_KM;
    });

    console.log(`  nearby (filter applied: ${isGrooming ? '10km' : 'none (city-wide)'}): ${nearby.length}`);

    if (nearby.length === 0) {
      console.log("NO_NEARBY_PARTNER");

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.FAILED },
      });

      return null;
    }

    // ── 4. Score partners (distance + load balancing) ──

    const scored = nearby.map((partner) => {
      const distance = getDistanceKm(
        lat,
        lng,
        partner.latitude,
        partner.longitude
      );

      const score =
        distance * WEIGHT_DISTANCE +
        partner.activeBookings * WEIGHT_ACTIVE_BOOKINGS +
        partner.todayCompletedBookings * WEIGHT_TODAY_COMPLETED;

      console.log(
        `  score ${partner.name}: ${score.toFixed(2)} (dist=${distance.toFixed(2)}, active=${partner.activeBookings}, today=${partner.todayCompletedBookings})`
      );

      return { partner, score };
    });

    scored.sort((a, b) => a.score - b.score);

    // ── 5. Pick best ──

    const selected = scored[0].partner;

    console.log("ASSIGNED_PARTNER:", selected.id, `(score: ${scored[0].score.toFixed(2)})`);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        partnerId: selected.id,
        status: BookingStatus.AWAITING_PAYMENT,
      },
    });

    await prisma.partner.update({
      where: { id: selected.id },
      data: {
        activeBookings: { increment: 1 },
      },
    });

    return selected;
  },
};
