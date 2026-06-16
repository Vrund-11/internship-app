import { Router } from "express";
import { promoController } from "../controllers/promo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/apply", authMiddleware, promoController.applyPromo);
router.post("/record-usage", authMiddleware, promoController.recordUsage);

export default router;
