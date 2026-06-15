import { prisma } from "../utils/prisma";

type CreateWaitlistInput = {
  phone: string;
  serviceType: string;
  wantsFaster: boolean;
};

export const waitlistRepository = {
  async create(data: CreateWaitlistInput) {
    return prisma.waitlist.create({
      data: {
        phone: data.phone,
        serviceType: data.serviceType,
        wantsFaster: data.wantsFaster,
      },
    });
  },

  async findUniqueEntry(phone: string, serviceType: string) {
    return prisma.waitlist.findUnique({
      where: {
        phone_serviceType: {
          phone,
          serviceType,
        },
      },
    });
  },

  async findAll() {
    return prisma.waitlist.findMany({
      orderBy: [
        { wantsFaster: "desc" },
        { createdAt: "asc" },
      ],
    });
  },
};
