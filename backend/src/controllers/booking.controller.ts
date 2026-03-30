import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { bookingService } from "../services/booking.service";

export const bookingController = {
  async createBooking(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { serviceType, petId, addressId, cityId } = req.body;

      const booking = await bookingService.createBooking({
        userId,
        serviceType,
        petId,
        addressId,
        cityId,
      });

      return res.json(booking);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking";

      return res.status(400).json({ error: message });
    }
  },
};
