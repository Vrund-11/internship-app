import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { reviewService } from "../services/review.service";

export const reviewController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { bookingId, rating, comment } = req.body;
      const parsedRating = Number(rating);

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
      }

      const review = await reviewService.createReview({
        userId,
        bookingId,
        rating: parsedRating,
        comment,
      });

      return res.json(review);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit review";

      return res.status(400).json({ error: message });
    }
  },
};
