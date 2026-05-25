import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

const MOCK_OTP = "123456";
const SECRET = process.env.JWT_SECRET || "secret";

export const authService = {
  async sendOTP(phone: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await authRepository.createOTP(phone, MOCK_OTP, expiresAt);

    console.log(`[OTP] ${phone} ${MOCK_OTP}`);

    return { success: true };
  },

  async verifyOTP(phone: string, code: string) {
    const otp = await authRepository.findValidOTP(phone, code);

    if (!otp) {
      throw new Error("Invalid or expired OTP");
    }

    await authRepository.deleteOTP(otp.id);

    let user = await authRepository.findUserByPhone(phone);

    if (!user) {
      user = await authRepository.createUser(phone);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await authRepository.createSession(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(oldToken: string) {
    try {
      const payload = jwt.verify(oldToken, SECRET) as { userId: string };

      const sessions = await authRepository.findSessionsByUserId(payload.userId);

      if (sessions.length === 0) {
        throw new Error("Session not found");
      }

      // Compare only the JWT signature (3rd segment) to avoid bcrypt's 72-byte truncation bug.
      const oldSignature = oldToken.split(".")[2] ?? oldToken;
      const matched = await Promise.all(
        sessions.map(async (session) => ({
          session,
          isValid: await bcrypt.compare(oldSignature, session.refreshToken),
        }))
      );

      const active = matched.find((entry) => entry.isValid);

      if (!active) {
        throw new Error("Token reuse detected");
      }

      await authRepository.deleteSession(active.session.id);

      const newRefreshToken = generateRefreshToken(payload.userId);
      const newAccessToken = generateAccessToken(payload.userId);

      await authRepository.createSession(payload.userId, newRefreshToken);

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
