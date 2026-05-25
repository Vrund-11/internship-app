import { prisma } from "../utils/prisma";

export const partnerRepository = {
  async listForTesting() {
    return prisma.partner.findMany({
      include: {
        city: true,
        services: true,
        bookings: {
          where: {
            slotStart: {
              gte: new Date(),
            },
            status: {
              in: ["AWAITING_PAYMENT", "CONFIRMED"],
            },
          },
          orderBy: {
            slotStart: "asc",
          },
          take: 5,
          select: {
            id: true,
            serviceType: true,
            slotStart: true,
            slotEnd: true,
            status: true,
          },
        },
      },
      orderBy: [{ cityId: "asc" }, { name: "asc" }],
    });
  },

  async findFirstCity() {
    return prisma.city.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true },
    });
  },

  async createTestingCity() {
    return prisma.city.create({
      data: {
        name: "Ahmedabad",
        state: "Gujarat",
        isActive: true,
      },
      select: { id: true },
    });
  },

  async upsertTestPartner(input: {
    name: string;
    phone: string;
    cityId: string;
    latitude: number;
    longitude: number;
  }) {
    return prisma.partner.upsert({
      where: { phone: input.phone },
      create: {
        name: input.name,
        phone: input.phone,
        cityId: input.cityId,
        latitude: input.latitude,
        longitude: input.longitude,
        isOnline: true,
        isVerified: true,
      },
      update: {
        name: input.name,
        cityId: input.cityId,
        latitude: input.latitude,
        longitude: input.longitude,
        isOnline: true,
        isVerified: true,
      },
    });
  },

  async ensureService(partnerId: string, serviceType: string) {
    const existing = await prisma.partnerService.findFirst({
      where: { partnerId, serviceType },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    return prisma.partnerService.create({
      data: { partnerId, serviceType },
    });
  },

  async deleteByPhones(phones: string[]) {
    await prisma.partnerService.deleteMany({
      where: {
        partner: {
          phone: {
            in: phones,
          },
        },
      },
    });

    return prisma.partner.deleteMany({
      where: {
        phone: {
          in: phones,
        },
      },
    });
  },
};
