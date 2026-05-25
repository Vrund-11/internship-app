import { prisma } from "../utils/prisma";

type CreateComplaintInput = {
  userId: string;
  bookingId?: string;
  message: string;
  phone: string;
  whatsapp: string;
  category: string;
  priority: string;
};

export const complaintRepository = {
  async findByBookingId(bookingId: string) {
    return prisma.complaint.findMany({
      where: { bookingId },
    });
  },

  /**
   * Count complaints filed by a user since the start of the current calendar day (UTC).
   * Used for daily rate-limiting (max 2 per day).
   */
  async countTodayByUserId(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.complaint.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });
  },

  async create(data: CreateComplaintInput) {
    return prisma.complaint.create({
      data: {
        userId: data.userId,
        bookingId: data.bookingId ?? null,
        message: data.message,
        phone: data.phone,
        whatsapp: data.whatsapp,
        category: data.category,
        priority: data.priority,
      },
    });
  },

  async findByUserId(userId: string) {
    return prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
};

