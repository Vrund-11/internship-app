import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { complaintService } from "../services/complaint.service";

export const complaintController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { bookingId, message, phone, whatsapp, category } = req.body;

      if (!message) {
        return res
          .status(400)
          .json({ error: "Missing required field: message" });
      }

      const complaint = await complaintService.createComplaint({
        userId,
        bookingId: bookingId || undefined,
        message,
        phone: phone || "",
        whatsapp: whatsapp || "",
        category: category || "OTHER",
      });

      return res.json(complaint);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit complaint";

      return res.status(400).json({ error: message });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const complaints = await complaintService.getUserComplaints(userId);
      return res.json(complaints);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch complaints";

      return res.status(500).json({ error: message });
    }
  },
};
