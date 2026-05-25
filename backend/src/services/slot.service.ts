import { prisma } from "../utils/prisma";
import { BookingStatus, ServiceType } from "@canovet/shared";
import { getDistanceKm } from "../utils/geo";
import { generateSlots, SlotWindow } from "../utils/slots";
const MAX_DISTANCE_KM = 10;

/**
 * Checks whether at least ONE online, verified, nearby partner
 * is free at the given slot time for the requested service + city.
 */
async function isSlotAvailable(
  slot: SlotWindow,
  cityId: string,
  serviceType: string,
  addressId: string
): Promise<boolean> {
  const partners = await prisma.partner.findMany({
    where: {
      isOnline: true,
      isVerified: true,
      cityId,
    },
    include: { services: true },
  });

  const eligible = partners.filter((p) =>
    p.services.some((s) => s.serviceType === serviceType)
  );

  if (eligible.length === 0) return false;

  // Get address coordinates for distance check
  const address = await prisma.address.findUnique({
    where: { id: addressId },
    select: { latitude: true, longitude: true },
  });

  if (!address) return false;

  for (const partner of eligible) {
    // Distance check
    const distance = getDistanceKm(
      address.latitude,
      address.longitude,
      partner.latitude,
      partner.longitude
    );

    if (distance > MAX_DISTANCE_KM) continue;

    // Time conflict check — windows overlap when start < otherEnd and end > otherStart
    const conflict = await prisma.booking.findFirst({
      where: {
        partnerId: partner.id,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
        },
        slotStart: {
          lt: slot.slotEnd,
        },
        slotEnd: {
          gt: slot.slotStart,
        },
      },
      select: { id: true },
    });

    if (!conflict) return true; // At least one partner is free
  }

  return false;
}

export const slotService = {
  /**
   * Returns all available time slots for a given date, city, service, and address.
   */
  async getAvailableSlots(
    date: Date,
    cityId: string,
    serviceType: string,
    addressId: string
  ): Promise<SlotWindow[]> {
    if (serviceType === ServiceType.GROOMING) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selected = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      if (selected.getTime() <= today.getTime()) {
        return [];
      }
    }

    const allSlots = generateSlots(date);

    // Filter out past slots (if the date is today)
    const now = new Date();
    const futureSlots = allSlots.filter(
      (slot) => slot.slotStart.getTime() > now.getTime()
    );

    if (futureSlots.length === 0) return [];

    const available: SlotWindow[] = [];

    for (const slot of futureSlots) {
      const ok = await isSlotAvailable(slot, cityId, serviceType, addressId);

      if (ok) available.push(slot);
    }

    return available;
  },
};
