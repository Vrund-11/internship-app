import { Request, Response } from "express";
import { waitlistRepository } from "../repositories/waitlist.repository";

export const waitlistController = {
  async register(req: Request, res: Response) {
    try {
      const { phone, serviceType, wantsFaster } = req.body;

      if (!phone || !serviceType) {
        return res.status(400).json({ error: "Phone and serviceType are required" });
      }

      // Normalize phone number (strip whitespace and +91 prefix for consistency)
      const cleanPhone = phone.trim().replace(/\s+/g, "").replace(/^\+91/, "");

      // Check if already registered
      const existing = await waitlistRepository.findUniqueEntry(cleanPhone, serviceType);
      if (existing) {
        return res.status(400).json({ error: "Already registered for early access" });
      }

      const entry = await waitlistRepository.create({
        phone: cleanPhone,
        serviceType,
        wantsFaster: !!wantsFaster,
      });

      return res.json({ success: true, entry });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register for early access";
      return res.status(400).json({ error: message });
    }
  },

  async checkStatus(req: Request, res: Response) {
    try {
      const phone = req.query.phone as string;
      const serviceType = req.query.serviceType as string;

      if (!phone || !serviceType) {
        return res.status(400).json({ error: "Phone and serviceType query parameters are required" });
      }

      const cleanPhone = phone.trim().replace(/\s+/g, "").replace(/^\+91/, "");

      const entry = await waitlistRepository.findUniqueEntry(cleanPhone, serviceType);

      return res.json({ registered: !!entry });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to check waitlist status";
      return res.status(500).json({ error: message });
    }
  },

  async listAll(req: Request, res: Response) {
    try {
      const entries = await waitlistRepository.findAll();
      return res.json(entries);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch waitlist entries";
      return res.status(500).json({ error: message });
    }
  },
};
