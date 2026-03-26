import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { authService } from "../services/auth.service";

export const authController = {
  async sendOTP(req: Request, res: Response) {
    try {
      const { phone } = req.body;

      const result = await authService.sendOTP(phone);

      res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP";

      res.status(400).json({ error: message });
    }
  },

  async verifyOTP(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;

      const result = await authService.verifyOTP(phone, otp);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      res.json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify OTP";

      res.status(400).json({ error: message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        return res.status(401).json({ error: "No token" });
      }

      const result = await authService.refreshToken(token);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      return res.json({
        accessToken: result.accessToken,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid refresh token";

      return res.status(401).json({ error: message });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await authService.getMe(userId);

      return res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unauthorized";

      return res.status(401).json({ error: message });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        return res.json({ success: true });
      }

      res.clearCookie("refreshToken");

      return res.json({ success: true });
    } catch (_err) {
      return res.status(500).json({ error: "Logout failed" });
    }
  },
};
