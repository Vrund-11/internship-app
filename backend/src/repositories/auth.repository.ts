import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";

async function hashToken(token: string) {
  // bcrypt silently truncates inputs at 72 bytes. Two JWTs for the same user share
  // identical header + userId in the first ~72 bytes, so hashing the full token
  // makes bcrypt treat different tokens as equal (reuse detection breaks).
  // Fix: hash only the signature segment (3rd dot-part) — it's always unique and < 72 bytes.
  const signature = token.split(".")[2] ?? token;
  return bcrypt.hash(signature, 10);
}

export const authRepository = {
  async createOTP(phone: string, code: string, expiresAt: Date) {
    return prisma.oTP.create({
      data: { phone, code, expiresAt },
    });
  },

  async findValidOTP(phone: string, code: string) {
    return prisma.oTP.findFirst({
      where: {
        phone,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  },

  async deleteOTP(id: string) {
    return prisma.oTP.delete({
      where: { id },
    });
  },

  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async createUser(phone: string) {
    return prisma.user.create({
      data: { phone },
    });
  },

  async createSession(userId: string, refreshToken: string) {
    const hashed = await hashToken(refreshToken);

    return prisma.userSession.create({
      data: {
        userId,
        refreshToken: hashed,
      },
    });
  },

  async findSessionByUserId(userId: string) {
    return prisma.userSession.findFirst({
      where: { userId },
    });
  },

  async findSessionsByUserId(userId: string) {
    return prisma.userSession.findMany({
      where: { userId },
    });
  },

  async deleteSession(id: string) {
    return prisma.userSession.delete({
      where: { id },
    });
  },

  async updateUser(id: string, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};
