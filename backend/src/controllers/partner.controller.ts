import { Request, Response } from "express";
import { partnerService } from "../services/partner.service";

export const partnerController = {
  async list(req: Request, res: Response) {
    try {
      const partners = await partnerService.listForTesting();
      return res.json(partners);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load partners";

      return res.status(400).json({ error: message });
    }
  },

  async seed(req: Request, res: Response) {
    try {
      const partners = await partnerService.seedTestingPartners();
      return res.json({ success: true, count: partners.length });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to seed partners";

      return res.status(400).json({ error: message });
    }
  },

  async getClinics(req: Request, res: Response) {
    try {
      const search = (req.query.search as string) || "";
      const { prisma } = require("../utils/prisma"); // Direct import since it's just a controller

      const partners = await prisma.partner.findMany({
        where: {
          isOnline: true,
          isVerified: true,
          services: {
            some: {
              serviceType: "VET_CLINIC",
            },
          },
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          rating: true,
          totalCompleted: true,
          cityId: true,
          clinicAddresses: true,
        },
        take: 20,
      });

      return res.json({ clinics: partners });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch clinics";
      return res.status(500).json({ error: message });
    }
  },
};
