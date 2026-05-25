import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.post("/order", authMiddleware, paymentController.createOrder);
router.post("/pay", authMiddleware, paymentController.pay);

export default router;
