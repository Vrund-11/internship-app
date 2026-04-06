import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { BookingStatus } from "@canovet/shared";

export const paymentController = {
  async pay(req: Request, res: Response) {
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

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
