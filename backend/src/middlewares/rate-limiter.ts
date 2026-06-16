import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redis";

export const otpRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const phone = req.body.phone;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const identifier = String(phone).trim();

    const key1m = `limit:otp:1m:${identifier}`;
    const key24h = `limit:otp:24h:${identifier}`;

    // 1. Check 1-minute limit (max 1 request per minute)
    const current1m = await redisClient.get(key1m);
    if (current1m && parseInt(current1m) >= 1) {
      return res.status(429).json({
        error: "Please wait 1 minute before requesting another OTP.",
      });
    }

    // 2. Check 24-hour limit (max 5 requests per 24 hours)
    const current24h = await redisClient.get(key24h);
    if (current24h && parseInt(current24h) >= 5) {
      return res.status(429).json({
        error: "Daily limit of 5 OTP requests reached. Please try again in 24 hours.",
      });
    }

    // 3. Increment counters
    const count1m = await redisClient.incr(key1m);
    if (count1m === 1) {
      await redisClient.expire(key1m, 60);
    }

    const count24h = await redisClient.incr(key24h);
    if (count24h === 1) {
      await redisClient.expire(key24h, 86400); // 24 hours
    }

    next();
  } catch (err) {
    console.error("[RATE LIMITER] Error:", err);
    // Fallback: in case Redis fails, allow user flow to continue so we do not block legitimate logins
    next();
  }
};
