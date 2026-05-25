import { prisma } from "../utils/prisma";
import { BookingStatus } from "@canovet/shared";
import { reviewRepository } from "../repositories/review.repository";

type CreateReviewInput = {
  userId: string;
  bookingId: string;
  rating: number;
  comment?: string;
};

export const reviewService = {
  async createReview(data: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: {
        id: true,
        userId: true,
        partnerId: true,
        status: true,
      },
    });

    if (!booking || booking.userId !== data.userId) {
      throw new Error("Booking not found");
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new Error("Only completed bookings can be reviewed");
    }

    if (!booking.partnerId) {
      throw new Error("Booking has no assigned partner");
    }

    const existing = await reviewRepository.findByBookingId(data.bookingId);

    if (existing) {
      throw new Error("Review already submitted for this booking");
    }

    const review = await reviewRepository.create({
      userId: data.userId,
      partnerId: booking.partnerId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment,
    });

    const stats = await reviewRepository.getPartnerStats(booking.partnerId);
    const averageRating = stats._avg.rating ?? 0;

    await prisma.partner.update({
      where: { id: booking.partnerId },
      data: { rating: averageRating },
    });

    return review;
  },
};
