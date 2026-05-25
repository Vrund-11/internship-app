import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/test-data", authMiddleware, bookingController.getTestData);
router.post("/pets", authMiddleware, bookingController.createPet);
router.post("/addresses", authMiddleware, bookingController.createAddress);
router.get("/pets", authMiddleware, bookingController.listPets);
router.get("/addresses", authMiddleware, bookingController.listAddresses);
router.get("/history", authMiddleware, bookingController.listBookings);
router.get("/slots", authMiddleware, bookingController.getAvailableSlots);
router.get("/:id", authMiddleware, bookingController.getBooking);
router.post("/", authMiddleware, bookingController.createBooking);
router.post("/:id/cancel", authMiddleware, bookingController.cancelBooking);
router.post("/:id/reschedule", authMiddleware, bookingController.rescheduleBooking);
router.post("/:id/complete", authMiddleware, bookingController.completeBooking);
router.post("/:id/check-in", authMiddleware, bookingController.checkInBooking);

export default router;
