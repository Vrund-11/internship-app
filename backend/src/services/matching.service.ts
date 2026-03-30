import { getIO, getOnlinePartners } from "../socket";

type BookingForMatching = {
  id: string;
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

    const allPartners = Array.from(getOnlinePartners().values());

    if (allPartners.length === 0) {
      console.log("NO_PARTNERS_AVAILABLE");
      return;
    }

    const state = {
      attemptedPartners: new Set<string>(),
      timeoutId: null as NodeJS.Timeout | null,
    };

    activeMatches.set(booking.id, state);

    await this.dispatchNextBatch(booking, allPartners);
  },

  async dispatchNextBatch(booking: BookingForMatching, allPartners: string[]) {
    const state = activeMatches.get(booking.id);

    if (!state) {
      return;
    }

    const remaining = allPartners.filter(
      (partner) => !state.attemptedPartners.has(partner)
    );

    if (remaining.length === 0) {
      console.log("ALL_PARTNERS_EXHAUSTED");
      activeMatches.delete(booking.id);
      return;
    }

    const batch = remaining.slice(0, BATCH_SIZE);

    const io = getIO();

    batch.forEach((socketId) => {
      state.attemptedPartners.add(socketId);
      io.to(socketId).emit("booking_request", booking);
    });

    console.log("BATCH_SENT:", batch.length);

    state.timeoutId = setTimeout(async () => {
      console.log("TIMEOUT  NEXT BATCH");
      await this.dispatchNextBatch(booking, allPartners);
    }, TIMEOUT);
  },
};
