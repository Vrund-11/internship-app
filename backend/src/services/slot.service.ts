import { prisma } from "../utils/prisma";
import { BookingStatus, ServiceType } from "@canovet/shared";
import { getDistanceKm } from "../utils/geo";
import { generateSlots, SlotWindow } from "../utils/slots";

const MAX_DISTANCE_KM = 10;

export const slotService = {
  /**
   * Returns all available time slots for a given date, city, service, and address.
   */
  async getAvailableSlots(
    date: Date,
    cityId: string,
    serviceType: string,
    addressId: string | null,
    clinicId: string | null
  ): Promise<{ slots: Array<SlotWindow & { available: boolean }>; noPartnersNearby: boolean }> {
    const allSlots = generateSlots(date);
    const now = new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let noPartnersNearby = false;

    if (serviceType === ServiceType.VET_CLINIC) {
      if (!clinicId) return { slots: [], noPartnersNearby: false };

      const clinic = await prisma.partner.findUnique({
        where: { id: clinicId },
        include: { services: true },
      });

      if (!clinic || !clinic.isVerified || !clinic.isOnline) {
        noPartnersNearby = true;
      } else if (clinic.cityId !== cityId) {
        noPartnersNearby = true;
      } else {
        const hasClinicService = clinic.services.some(
          (service) => service.serviceType === ServiceType.VET_CLINIC
        );
        if (!hasClinicService) {
          noPartnersNearby = true;
        }
      }

      if (noPartnersNearby || !clinic) {
        return {
          slots: allSlots.map((slot) => ({ ...slot, available: false })),
          noPartnersNearby: true,
        };
      }

      // Pre-fetch clinic bookings for the day to check conflicts in-memory
      const clinicBookings = await prisma.booking.findMany({
        where: {
          partnerId: clinic.id,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
          },
          slotStart: { gte: startOfDay },
          slotEnd: { lte: endOfDay },
        },
        select: { slotStart: true, slotEnd: true },
      });

      const slots = allSlots.map((slot) => {
        const isFuture = slot.slotStart.getTime() > now.getTime();
        if (!isFuture) {
          return { ...slot, available: false };
        }

        const conflictCount = clinicBookings.filter(
          (b) => slot.slotStart < b.slotEnd && slot.slotEnd > b.slotStart
        ).length;
        return { ...slot, available: conflictCount < 5 };
      });

      return { slots, noPartnersNearby: false };
    } else {
      const isGrooming = serviceType === ServiceType.GROOMING;

      if (isGrooming && !addressId) return { slots: [], noPartnersNearby: false };

      // Fetch address coords if grooming
      let lat = 23.0225;
      let lng = 72.5714;
      if (isGrooming && addressId) {
        const address = await prisma.address.findUnique({
          where: { id: addressId },
          select: { latitude: true, longitude: true },
        });
        if (!address) return { slots: [], noPartnersNearby: false };
        lat = address.latitude;
        lng = address.longitude;
      }

      // Fetch eligible partners
      const partners = await prisma.partner.findMany({
        where: {
          isOnline: true,
          isVerified: true,
          cityId,
          services: {
            some: { serviceType },
          },
        },
      });

      if (partners.length === 0) {
        noPartnersNearby = true;
      } else {
        // Distance check in-memory (Only for GROOMING)
        const nearbyPartners = isGrooming
          ? partners.filter((p) => {
              const distance = getDistanceKm(lat, lng, p.latitude, p.longitude);
              return distance <= MAX_DISTANCE_KM;
            })
          : partners;

        if (nearbyPartners.length === 0) {
          noPartnersNearby = true;
        } else {
          const nearbyPartnerIds = nearbyPartners.map((p) => p.id);

          // Pre-fetch bookings for all nearby partners on that day
          const dayBookings = await prisma.booking.findMany({
            where: {
              partnerId: { in: nearbyPartnerIds },
              status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
              },
              slotStart: { gte: startOfDay },
              slotEnd: { lte: endOfDay },
            },
            select: { partnerId: true, slotStart: true, slotEnd: true },
          });

          const slots = allSlots.map((slot) => {
            const isFuture = slot.slotStart.getTime() > now.getTime();
            if (!isFuture) {
              return { ...slot, available: false };
            }

            // A slot is available if there is AT LEAST ONE nearby partner without conflict
            const hasFreePartner = nearbyPartners.some((partner) => {
              const partnerConflicts = dayBookings.filter((b) => b.partnerId === partner.id);
              const hasConflict = partnerConflicts.some(
                (b) => slot.slotStart < b.slotEnd && slot.slotEnd > b.slotStart
              );
              return !hasConflict;
            });

            return { ...slot, available: hasFreePartner };
          });

          return { slots, noPartnersNearby: false };
        }
      }

      return {
        slots: allSlots.map((slot) => ({ ...slot, available: false })),
        noPartnersNearby: true,
      };
    }
  },
};
