import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { prisma } from "../utils/prisma";

export const promoController = {
  async applyPromo(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { code, amount } = req.body;

      if (!code || !amount) {
        return res.status(400).json({ error: "Code and amount are required" });
      }

      const promo = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!promo || !promo.isActive) {
        return res.status(400).json({ error: "Invalid or expired promo code" });
      }

      // Count how many times this user has used this promo
      const usageCount = await prisma.promoUsage.count({
        where: {
          userId,
          promoCodeId: promo.id,
        },
      });

      if (usageCount >= promo.maxUsesPerUser) {
        return res.status(400).json({
          error: `You've already used this code ${promo.maxUsesPerUser} times`,
        });
      }

      const discount = Math.round((amount * promo.discountPercent) / 100);
      const total = amount - discount;

      return res.json({
        valid: true,
        code: promo.code,
        discountPercent: promo.discountPercent,
        discount,
        total,
        usesRemaining: promo.maxUsesPerUser - usageCount,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to apply promo";

      return res.status(400).json({ error: message });
    }
  },

  async recordUsage(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { code } = req.body;

      const promo = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!promo) {
        return res.status(400).json({ error: "Invalid promo code" });
      }

      await prisma.promoUsage.create({
        data: {
          userId,
          promoCodeId: promo.id,
        },
      });

      return res.json({ success: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to record usage";

      return res.status(400).json({ error: message });
    }
  },
};
