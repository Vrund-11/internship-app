import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.post("/razorpay", paymentController.webhook);

export default router;
