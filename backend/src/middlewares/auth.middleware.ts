import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret";

export type AuthenticatedRequest = Request & {
  userId?: string;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };

    (req as AuthenticatedRequest).userId = decoded.userId;

    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
