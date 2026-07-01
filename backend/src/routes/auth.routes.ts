import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login-signup", authController.loginOrSignup);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-token", authController.verifyResetToken);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);
router.patch("/profile", authMiddleware, authController.updateProfile);

export default router;
