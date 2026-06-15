import { Router } from "express";
import { waitlistController } from "../controllers/waitlist.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", waitlistController.register);
router.get("/check", waitlistController.checkStatus);
router.get("/", authMiddleware, waitlistController.listAll);

export default router;
