import { prisma } from "../utils/prisma";

export const authRepository = {
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async updateUser(id: string, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async createUserWithEmail(email: string, passwordHash?: string, name?: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },
};
