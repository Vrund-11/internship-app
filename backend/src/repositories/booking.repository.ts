import { prisma } from "../utils/prisma";

type CreateBookingInput = {
  userId: string;
  cityId: string;
  serviceType: string;
  petId: string;
  addressId?: string | null;
  clinicId?: string | null;
  clinicAddressId?: string | null;
  partnerId?: string | null;
  slotStart: Date;
  slotEnd: Date;
  status?: string;
  verificationOtp?: string;
};

export const bookingRepository = {
  async create(data: CreateBookingInput) {
    return prisma.booking.create({
      data,
    });
  },

  async countBookingsByUserInRange(
    userId: string,
    start: Date,
    end: Date
  ) {
    return prisma.booking.count({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            totalCompleted: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            totalCompleted: true,
          },
        },
        clinicAddress: true,
        pet: true,
        address: true,
        review: true,
        complaints: true,
        rescheduleLogs: true,
      },
    });
  },

  async findPetsByUserId(userId: string) {
    return prisma.pet.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  },

  async createPet(
    userId: string,
    name: string,
    type: string,
    breed: string,
    age: number,
    weight: number
  ) {
    return prisma.pet.create({
      data: { userId, name, type, breed, age, weight },
    });
  },

  async findAddressesByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { text: "asc" },
    });
  },

  async findAddressByUserAndText(userId: string, text: string) {
    return prisma.address.findFirst({
      where: { userId, text },
      select: { id: true },
    });
  },

  async createAddress(
    userId: string,
    text: string,
    latitude: number,
    longitude: number,
    label: string,
    house: string,
    area: string,
    city: string,
    state: string,
    pincode: string
  ) {
    return prisma.address.create({
      data: {
        userId,
        text,
        latitude,
        longitude,
        label,
        house,
        area,
        city,
        state,
        pincode,
      },
    });
  },

  async findBookingsByUserId(userId: string, skip = 0, take = 10) {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            totalCompleted: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            totalCompleted: true,
          },
        },
        clinicAddress: true,
        pet: true,
        address: true,
        review: true,
        complaints: true,
        rescheduleLogs: true,
      },
    });
  },
};
