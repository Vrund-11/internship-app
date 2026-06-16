import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { BookingStatus } from "@canovet/shared";
import { razorpay } from "../utils/razorpay";

async function completeBooking(bookingId: string, partnerId: string | null) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.COMPLETED },
  });

  if (partnerId) {
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        totalCompleted: { increment: 1 },
        todayCompletedBookings: { increment: 1 },
        activeBookings: { decrement: 1 },
      },
    });
  }
}

export const paymentController = {
  async createOrder(req: Request, res: Response) {
    try {
      const { bookingId } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.status !== BookingStatus.AWAITING_PAYMENT) {
        throw new Error("Invalid booking state");
      }

      const payment = await prisma.payment.findFirst({
        where: { bookingId },
      });

      if (!payment || payment.status === "PAID") {
        return res.json({ success: true });
      }

      const order = await razorpay.orders.create({
        amount: payment.amount * 100,
        currency: "INR",
        receipt: bookingId,
        notes: {
          bookingId,
        },
      });

      res.json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async webhook(req: Request, res: Response) {
    try {
      const event = req.body;

      if (event.event === "payment.captured") {
        const bookingId = event.payload?.payment?.entity?.notes?.bookingId;

        if (bookingId) {
          const payment = await prisma.payment.findFirst({
            where: { bookingId },
          });

          if (!payment || payment.status === "PAID") {
            return res.json({ status: "ok" });
          }

          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
          });

          if (!booking || booking.status !== BookingStatus.AWAITING_PAYMENT) {
            throw new Error("Invalid booking state");
          }

          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID" },
          });

          await completeBooking(bookingId, booking.partnerId);
        }
      }

      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async pay(req: Request, res: Response) {
    try {
      const { bookingId } = req.body;

      const payment = await prisma.payment.findFirst({
        where: { bookingId },
      });

      if (!payment || payment.status === "PAID") {
        return res.json({ success: true });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.status !== BookingStatus.AWAITING_PAYMENT) {
        throw new Error("Invalid booking state");
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" },
      });

      await completeBooking(bookingId, booking.partnerId);

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
