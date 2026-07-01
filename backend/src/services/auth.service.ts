import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authRepository } from "../repositories/auth.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { redisClient } from "../utils/redis";
import { emailService } from "./email.service";

const SECRET = process.env.JWT_SECRET || "secret";

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return "Please enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
  return null;
}

export const authService = {
  async loginOrSignup(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(normalizedEmail);
    if (emailErr) throw new Error(emailErr);

    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      // Create user flow
      const passErr = validatePassword(pass);
      if (passErr) throw new Error(passErr);

      const passwordHash = await bcrypt.hash(pass, 10);
      const newUser = await authRepository.createUserWithEmail(normalizedEmail, passwordHash);

      const accessToken = generateAccessToken(newUser.id);
      const refreshToken = generateRefreshToken(newUser.id);

      await authService.createRedisSession(newUser.id, refreshToken);

      return {
        user: newUser,
        accessToken,
        refreshToken,
      };
    }

    // Login flow
    if (!user.passwordHash) {
      throw new Error("Password is not set for this account. Please use password reset to set a password.");
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await authService.createRedisSession(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  },


  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(normalizedEmail);
    if (emailErr) throw new Error(emailErr);

    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      // Sleep to prevent timing attacks / email enumeration
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const key = `password-reset:${token}`;
    await redisClient.setEx(key, 3600, user.id); // 1 hour expiration

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    try {
      await emailService.sendResetPasswordEmail(normalizedEmail, resetLink);
    } catch (err: any) {
      console.error("[FORGOT_PASSWORD] Failed to send email, falling back to console warning:", err?.message || err);
      console.warn("\n=== [FALLBACK PASSWORD RESET LINK] ===");
      console.warn(`To: ${normalizedEmail}`);
      console.warn(`Link: ${resetLink}`);
      console.warn("======================================\n");
    }

    return { success: true };
  },

  async verifyResetToken(token: string) {
    const key = `password-reset:${token}`;
    const userId = await redisClient.get(key);
    return { valid: !!userId };
  },

  async resetPassword(token: string, pass: string) {
    const key = `password-reset:${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      throw new Error("Invalid or expired password reset link");
    }

    const passErr = validatePassword(pass);
    if (passErr) throw new Error(passErr);

    const passwordHash = await bcrypt.hash(pass, 10);
    await authRepository.updateUserPassword(userId, passwordHash);

    // Cleanup token
    await redisClient.del(key);

    // Revoke all active sessions of this user in Redis
    try {
      const keys = await redisClient.keys(`sess:${userId}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error("Failed to revoke user sessions on reset password:", err);
    }

    return { success: true };
  },

  async createRedisSession(userId: string, refreshToken: string) {
    const oldSignature = refreshToken.split(".")[2] ?? refreshToken;
    const signatureHash = crypto.createHash("sha256").update(oldSignature).digest("hex");
    const key = `sess:${userId}:${signatureHash}`;
    await redisClient.setEx(key, 604800, "active");
  },

  async revokeSession(refreshToken: string) {
    try {
      const decoded = jwt.decode(refreshToken) as { userId?: string } | null;
      if (decoded && decoded.userId) {
        const oldSignature = refreshToken.split(".")[2] ?? refreshToken;
        const signatureHash = crypto.createHash("sha256").update(oldSignature).digest("hex");
        const key = `sess:${decoded.userId}:${signatureHash}`;
        await redisClient.del(key);
      }
    } catch {}
  },

  async refreshToken(oldToken: string) {
    try {
      const payload = jwt.verify(oldToken, SECRET) as { userId: string };

      const oldSignature = oldToken.split(".")[2] ?? oldToken;
      const signatureHash = crypto.createHash("sha256").update(oldSignature).digest("hex");

      const key = `sess:${payload.userId}:${signatureHash}`;
      console.log(`[REFRESH_DB] sessionKey is: ${key}`);
      const sessionExists = await redisClient.exists(key);

      if (!sessionExists) {
        console.log(`[REFRESH_DB] Session NOT found in Redis for key: ${key}`);
        throw new Error("Session not found");
      }

      const delResult = await redisClient.del(key);
      console.log(`[REFRESH_DB] Deleted session key: ${key}, result: ${delResult}`);

      const newRefreshToken = generateRefreshToken(payload.userId);
      const newAccessToken = generateAccessToken(payload.userId);

      await authService.createRedisSession(payload.userId, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (_err) {
      throw new Error("Invalid refresh token");
    }
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new Error("Unauthorized");
    }

    return user;
  },

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await authRepository.updateUser(userId, data);
    return user;
  },
};
