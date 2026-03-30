import { prisma } from "../utils/prisma";

type CreateBookingInput = {
  userId: string;
  cityId: string;
  serviceType: string;
  petId: string;
  addressId: string;
};

export const bookingRepository = {
  async create(data: CreateBookingInput) {
    return prisma.booking.create({
      data,
    });
  },
};
