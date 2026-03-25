import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
