import { prisma } from "../utils/prisma";

type CreateReviewInput = {
  userId: string;
  partnerId: string;
  bookingId: string;
  rating: number;
  comment?: string;
};

export const reviewRepository = {
  async findByBookingId(bookingId: string) {
    return prisma.review.findUnique({
      where: { bookingId },
    });
  },

  async create(data: CreateReviewInput) {
    return prisma.review.create({
      data,
    });
  },

  async getPartnerStats(partnerId: string) {
    return prisma.review.aggregate({
      where: { partnerId },
      _avg: { rating: true },
      _count: { rating: true },
    });
  },
};
