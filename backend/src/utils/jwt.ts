import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "secret";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: "30m",
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: "7d",
  });
};
