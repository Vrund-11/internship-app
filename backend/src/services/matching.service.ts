import { BookingStatus } from "@canovet/shared";
import { getIO, getPartnerSocketMap } from "../socket";
import { prisma } from "../utils/prisma";

type BookingForMatching = {
  id: string;
  cityId: string;
  serviceType: string;
};

const BATCH_SIZE = 3;
const TIMEOUT = 10000;

export const activeMatches = new Map<
  string,
  {
    attemptedPartners: Set<string>;
    timeoutId: NodeJS.Timeout | null;
  }
>();

export const matchingService = {
  async startMatching(booking: BookingForMatching) {
    console.log("MATCHING_START:", booking.id);

    const partnerSocketMap = getPartnerSocketMap();
    const partners = await prisma.partner.findMany({
      where: {
        isOnline: true,
        isVerified: true,
        cityId: booking.cityId,
      },
      include: {
        services: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const eligible = partners
      .filter((partner) =>
        partner.services.some(
          (service) => service.serviceType === booking.serviceType
        )
      )
      .sort((a, b) => {
        if (a.activeBookings !== b.activeBookings) {
          return a.activeBookings - b.activeBookings;
        }

        return a.todayCompletedBookings - b.todayCompletedBookings;
      });

    const allPartners = eligible
      .map((partner) => ({
        partnerId: partner.id,
        socketId: partnerSocketMap.get(partner.id),
      }))
      .filter(
        (
          partner
        ): partner is {
          partnerId: string;
          socketId: string;
        } => Boolean(partner.socketId)
      );

    if (allPartners.length === 0) {
      console.log("NO_ELIGIBLE_PARTNERS");
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.FAILED },
      });
      return;
    }

    const state = {
      attemptedPartners: new Set<string>(),
      timeoutId: null as NodeJS.Timeout | null,
    };

    activeMatches.set(booking.id, state);

    await this.dispatchNextBatch(booking, allPartners);
  },

  async dispatchNextBatch(
    booking: BookingForMatching,
    allPartners: Array<{ partnerId: string; socketId: string }>
  ) {
    const state = activeMatches.get(booking.id);

    if (!state) {
      return;
    }

    const remaining = allPartners.filter(
      (partner) => !state.attemptedPartners.has(partner.partnerId)
    );

    if (remaining.length === 0) {
      console.log("ALL_PARTNERS_EXHAUSTED");
      activeMatches.delete(booking.id);
      return;
    }

    const batch = remaining.slice(0, BATCH_SIZE);

    const io = getIO();

    batch.forEach((partner) => {
      state.attemptedPartners.add(partner.partnerId);
      io.to(partner.socketId).emit("booking_request", booking);
    });

    console.log("BATCH_SENT:", batch.length);

    state.timeoutId = setTimeout(async () => {
      console.log("TIMEOUT  NEXT BATCH");
      await this.dispatchNextBatch(booking, allPartners);
    }, TIMEOUT);
  },
};
