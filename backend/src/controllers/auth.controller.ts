import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { authService } from "../services/auth.service";

export const authController = {
  async loginOrSignup(req: Request, res: Response) {
    try {
      const { email, password, platform } = req.body;
      const result = await authService.loginOrSignup(email, password);

      if (platform === "mobile") {
        res.json({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      } else {
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          sameSite: "lax",
        });

        res.json({
          user: result.user,
          accessToken: result.accessToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      res.status(400).json({ error: message });
    }
  },


  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to handle forgot password request";
      res.status(400).json({ error: message });
    }
  },

  async verifyResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await authService.verifyResetToken(token);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify token";
      res.status(400).json({ error: message });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      res.status(400).json({ error: message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const token =
        req.cookies.refreshToken ||
        req.body.refreshToken ||
        (req.headers["x-refresh-token"] as string | undefined);

      if (!token) {
        return res.status(401).json({ error: "No token" });
      }

      const result = await authService.refreshToken(token);

      if (req.cookies.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });

        return res.json({
          accessToken: result.accessToken,
        });
      } else {
        return res.json({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid refresh token";
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
      const token =
        req.cookies.refreshToken ||
        req.body.refreshToken ||
        (req.headers["x-refresh-token"] as string | undefined);

      if (token) {
        await authService.revokeSession(token);
      }

      if (req.cookies.refreshToken) {
        res.clearCookie("refreshToken");
      }

      return res.json({ success: true });
    } catch (_err) {
      return res.status(500).json({ error: "Logout failed" });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name } = req.body;
      const user = await authService.updateProfile(userId, { name });

      return res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      return res.status(400).json({ error: message });
    }
  },
};
