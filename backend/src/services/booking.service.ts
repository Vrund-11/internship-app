import { matchingService } from "./matching.service";
import { bookingRepository } from "../repositories/booking.repository";

type CreateBookingInput = {
  userId: string;
  cityId: string;
  serviceType: string;
  petId: string;
  addressId: string;
};

export const bookingService = {
  async createBooking(data: CreateBookingInput) {
    const booking = await bookingRepository.create(data);

    console.log("BOOKING_CREATED:", booking.id);
    await matchingService.startMatching(booking);

    return booking;
  },
};
