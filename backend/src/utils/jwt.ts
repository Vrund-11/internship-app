import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET || "secret";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: "30m",
  });
};

export const generateRefreshToken = (userId: string) => {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, jti }, ACCESS_SECRET, {
    expiresIn: "7d",
  });
};

