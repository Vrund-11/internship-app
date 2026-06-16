import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { bookingService } from "../services/booking.service";
import { slotService } from "../services/slot.service";

export const bookingController = {
  async getTestData(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const data = await bookingService.getOrCreateTestData(userId);

      return res.json(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load test data";

      return res.status(500).json({ error: message });
    }
  },

  async createBooking(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        serviceType,
        petId,
        addressId,
        clinicId,
        cityId,
        slotStart,
        slotEnd,
        preferredPartnerId,
      } = req.body;
      const parsedSlotStart = new Date(slotStart);
      const parsedSlotEnd = new Date(slotEnd);

      if (
        !slotStart ||
        !slotEnd ||
        Number.isNaN(parsedSlotStart.getTime()) ||
        Number.isNaN(parsedSlotEnd.getTime())
      ) {
        return res.status(400).json({ error: "Invalid slotStart or slotEnd" });
      }

      const diffMs = parsedSlotEnd.getTime() - parsedSlotStart.getTime();
      const diffHours = diffMs / (60 * 60 * 1000);

      if (diffHours !== 2 || diffMs <= 0) {
        return res.status(400).json({ error: "Slots must be 2-hour windows" });
      }

      bookingService.validateServiceWindow(serviceType, parsedSlotStart);

      const booking = await bookingService.createBooking({
        userId,
        serviceType,
        petId,
        addressId,
        clinicId,
        cityId,
        slotStart: parsedSlotStart,
        slotEnd: parsedSlotEnd,
        preferredPartnerId,
      });

      return res.json(booking);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking";

      return res.status(400).json({ error: message });
    }
  },

  async listPets(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const pets = await bookingService.listPets(userId);
      return res.json({ pets });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load pets";
      return res.status(500).json({ error: message });
    }
  },

  async createPet(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, type, breed, age, weight } = req.body;

      if (!name || !type || !breed) {
        return res.status(400).json({ error: "Missing pet details" });
      }

      const pet = await bookingService.createPet(userId, {
        name,
        type,
        breed,
        age: Number(age) || 1,
        weight: Number(weight) || 5,
      });

      return res.json(pet);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create pet";
      return res.status(400).json({ error: message });
    }
  },

  async listAddresses(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const addresses = await bookingService.listAddresses(userId);
      return res.json({ addresses });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load addresses";
      return res.status(500).json({ error: message });
    }
  },

  async createAddress(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { label, house, area, city, state, pincode, latitude, longitude } = req.body;

      if (!label || !house || !area || !city || !state || !pincode) {
        return res.status(400).json({ error: "Missing address details" });
      }

      const address = await bookingService.createAddress(userId, {
        label,
        house,
        area,
        city,
        state,
        pincode,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
      });

      return res.json(address);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create address";
      return res.status(400).json({ error: message });
    }
  },

  async listBookings(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      const result = await bookingService.listBookings(userId, page, limit);
      return res.json({
        bookings: result.bookings,
        page: Number.isFinite(page) && page > 0 ? page : 1,
        hasMore: result.hasMore,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load bookings";
      return res.status(500).json({ error: message });
    }
  },

  async getBooking(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await bookingService.getBooking(userId, bookingId);
      return res.json(booking);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load booking";
      const status = message === "Booking not found" ? 404 : 500;
      return res.status(status).json({ error: message });
    }
  },

  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { date, serviceType, cityId, addressId, clinicId } = req.query;

      if (!date || !serviceType || !cityId) {
        return res.status(400).json({
          error: "Missing required query params: date, serviceType, cityId",
        });
      }

      if (serviceType === "VET_CLINIC" && !clinicId) {
        return res.status(400).json({
          error: "Missing required query params: clinicId",
        });
      }

      if (serviceType === "GROOMING" && !addressId) {
        return res.status(400).json({
          error: "Missing required query params: addressId",
        });
      }

      const parsedDate = new Date(date as string);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }

      const result = await slotService.getAvailableSlots(
        parsedDate,
        cityId as string,
        serviceType as string,
        (addressId as string) ?? null,
        (clinicId as string) ?? null
      );

      return res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch slots";

      return res.status(500).json({ error: message });
    }
  },

  async cancelBooking(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await bookingService.cancelBooking(userId, bookingId);
      return res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel booking";
      return res.status(400).json({ error: message });
    }
  },

  async rescheduleBooking(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { slotStart, slotEnd } = req.body;

      if (!slotStart || !slotEnd) {
        return res.status(400).json({ error: "Missing slotStart or slotEnd" });
      }

      const parsedSlotStart = new Date(slotStart);
      const parsedSlotEnd = new Date(slotEnd);

      if (Number.isNaN(parsedSlotStart.getTime()) || Number.isNaN(parsedSlotEnd.getTime())) {
        return res.status(400).json({ error: "Invalid slotStart or slotEnd dates" });
      }

      const result = await bookingService.rescheduleBooking(
        userId,
        bookingId,
        parsedSlotStart,
        parsedSlotEnd
      );

      return res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reschedule booking";
      const status = message === "Booking not found" ? 404 : 400;
      return res.status(status).json({ error: message });
    }
  },

  async completeBooking(req: Request, res: Response) {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { verificationOtp } = req.body;

      if (!verificationOtp) {
        return res.status(400).json({ error: "Missing verificationOtp" });
      }

      const result = await bookingService.completeBookingWithOtp(bookingId, verificationOtp);
      return res.json({ success: true, booking: result });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to complete booking";
      return res.status(400).json({ error: message });
    }
  },

  async checkInBooking(req: Request, res: Response) {
    try {
      const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { verificationOtp } = req.body;

      if (!verificationOtp) {
        return res.status(400).json({ error: "Missing verificationOtp" });
      }

      const result = await bookingService.checkInBookingWithOtp(bookingId, verificationOtp);
      return res.json({ success: true, booking: result });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to check in booking";
      return res.status(400).json({ error: message });
    }
  },
};

