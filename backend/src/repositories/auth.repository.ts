import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";

async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
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

  async deleteSession(id: string) {
    return prisma.userSession.delete({
      where: { id },
    });
  },
};
