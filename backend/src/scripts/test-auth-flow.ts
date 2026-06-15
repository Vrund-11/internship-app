import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import app from "../app";
import axios from "axios";
import { redisClient, connectRedis } from "../utils/redis";
import crypto from "crypto";

const PORT = 5001;
const testUrl = `http://localhost:${PORT}`;

async function main() {
  console.log("🚀 Starting Automated Authentication E2E Test Suite...");
  
  // 1. Connect Redis
  await connectRedis();
  
  // 2. Start Test Server
  const server = app.listen(PORT, async () => {
    console.log(`[TEST SERVER] Running on port ${PORT}`);
    
    try {
      const phone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      
      console.log(`\n--- Test 1: Rate Limiting (1-minute window) ---`);
      console.log(`Sending 1st OTP to: ${phone}`);
      const res1 = await axios.post(`${testUrl}/auth/send-otp`, { phone });
      console.log(`1st OTP Response status: ${res1.status}`);
      
      console.log(`Sending 2nd OTP to: ${phone} (within 60s window)`);
      try {
        await axios.post(`${testUrl}/auth/send-otp`, { phone });
        console.log("❌ FAIL: Rate limiter did not block consecutive request!");
        process.exit(1);
      } catch (err: any) {
        if (err.response?.status === 429) {
          console.log(`✅ SUCCESS: Correctly blocked by rate limiter with 429: "${err.response.data.error}"`);
        } else {
          console.log(`❌ FAIL: Expected 429, got:`, err.response?.status);
          process.exit(1);
        }
      }

      console.log(`\n--- Test 2: Daily Rate Limit Check (24-hour window) ---`);
      // Clear 1m block so we can check 24h cap
      const key1m = `limit:otp:1m:${phone}`;
      await redisClient.del(key1m);
      
      // Set 24h limit to 5 in Redis to simulate 5 previous requests
      const key24h = `limit:otp:24h:${phone}`;
      await redisClient.set(key24h, "5");
      
      console.log(`Sending 6th OTP request to verify daily cap...`);
      try {
        await axios.post(`${testUrl}/auth/send-otp`, { phone });
        console.log("❌ FAIL: Daily limit cap did not block OTP!");
        process.exit(1);
      } catch (err: any) {
        if (err.response?.status === 429) {
          console.log(`✅ SUCCESS: Correctly blocked by daily limit with 429: "${err.response.data.error}"`);
        } else {
          console.log(`❌ FAIL: Expected 429, got:`, err.response?.status);
          process.exit(1);
        }
      }
      
      // Cleanup rate limit keys for phone so we can test OTP verification
      await redisClient.del(key1m);
      await redisClient.del(key24h);
      
      console.log(`\n--- Test 3: OTP Generation & Verification ---`);
      await axios.post(`${testUrl}/auth/send-otp`, { phone });
      
      // Verify OTP exists in Redis
      const cachedOtp = await redisClient.get(`otp:${phone}`);
      console.log(`Redis OTP key 'otp:${phone}' retrieved: "${cachedOtp}"`);
      if (cachedOtp !== "1234") {
        console.log("❌ FAIL: Incorrect OTP saved in Redis.");
        process.exit(1);
      }
      
      console.log("Verifying OTP via endpoint...");
      const verifyRes = await axios.post(`${testUrl}/auth/verify-otp`, {
        phone,
        otp: "1234",
        platform: "mobile"
      });
      
      const { user, accessToken, refreshToken } = verifyRes.data;
      console.log(`✅ SUCCESS: Verified successfully. User ID: ${user.id}`);
      
      // Verify OTP key deleted from Redis
      const deletedOtp = await redisClient.get(`otp:${phone}`);
      if (deletedOtp === null) {
        console.log(`✅ SUCCESS: OTP key deleted from Redis on verify.`);
      } else {
        console.log(`❌ FAIL: OTP key still exists in Redis!`);
        process.exit(1);
      }
      
      console.log(`\n--- Test 4: Redis Session Storage ---`);
      const signature = refreshToken.split(".")[2] ?? refreshToken;
      const signatureHash = crypto.createHash("sha256").update(signature).digest("hex");
      const sessionKey = `sess:${user.id}:${signatureHash}`;
      
      const sessionVal = await redisClient.get(sessionKey);
      console.log(`Redis Session key '${sessionKey}' retrieved: "${sessionVal}"`);
      if (sessionVal === "active") {
        console.log(`✅ SUCCESS: Session stored correctly in Redis memory.`);
      } else {
        console.log(`❌ FAIL: Session key not found in Redis!`);
        process.exit(1);
      }
      
      const sessionTtl = await redisClient.ttl(sessionKey);
      console.log(`Session key TTL: ${sessionTtl}s (Expected: ~604800s)`);
      if (sessionTtl > 600000) {
        console.log(`✅ SUCCESS: TTL set correctly to 7 days.`);
      } else {
        console.log(`❌ FAIL: TTL is incorrect.`);
        process.exit(1);
      }
      
      console.log(`\n--- Test 5: Fetch Profile via Access Token ---`);
      const meRes = await axios.get(`${testUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log(`Profile User Phone: ${meRes.data.phone}`);
      if (meRes.data.phone === phone) {
        console.log("✅ SUCCESS: Profile fetched successfully using access token.");
      } else {
        console.log("❌ FAIL: Phone mismatch.");
        process.exit(1);
      }
      
      console.log(`\n--- Test 6: Token Rotation (Refresh) ---`);
      const refreshRes = await axios.post(`${testUrl}/auth/refresh`, { refreshToken });
      const newAccessToken = refreshRes.data.accessToken;
      const newRefreshToken = refreshRes.data.refreshToken;
      console.log("✅ SUCCESS: Received rotated access and refresh tokens.");
      
      // Verify old session key is deleted from Redis
      const oldSessionExists = await redisClient.exists(sessionKey);
      if (!oldSessionExists) {
        console.log("✅ SUCCESS: Old rotated session key deleted from Redis.");
      } else {
        console.log("❌ FAIL: Old session key still exists in Redis!");
        process.exit(1);
      }
      
      // Verify new session key is created in Redis
      const newSignature = newRefreshToken.split(".")[2] ?? newRefreshToken;
      const newSignatureHash = crypto.createHash("sha256").update(newSignature).digest("hex");
      const newSessionKey = `sess:${user.id}:${newSignatureHash}`;
      const newSessionExists = await redisClient.exists(newSessionKey);
      if (newSessionExists) {
        console.log("✅ SUCCESS: New rotated session key active in Redis.");
      } else {
        console.log("❌ FAIL: New session key not found in Redis!");
        process.exit(1);
      }
      
      console.log(`\n--- Test 7: Secure Logout (Revocation) ---`);
      await axios.post(`${testUrl}/auth/logout`, { refreshToken: newRefreshToken });
      console.log("Logout endpoint triggered.");
      
      const loggedOutSessionExists = await redisClient.exists(newSessionKey);
      if (!loggedOutSessionExists) {
        console.log("✅ SUCCESS: Rotated session key deleted from Redis on logout.");
      } else {
        console.log("❌ FAIL: Session key still exists in Redis after logout!");
        process.exit(1);
      }
      
      console.log("Trying to refresh using logged-out token...");
      try {
        await axios.post(`${testUrl}/auth/refresh`, { refreshToken: newRefreshToken });
        console.log("❌ FAIL: Token was not revoked on server side!");
        process.exit(1);
      } catch (err: any) {
        if (err.response?.status === 401) {
          console.log("✅ SUCCESS: Correctly rejected with 401 Unauthorized.");
        } else {
          console.log("❌ FAIL: Expected 401, got:", err.response?.status);
          process.exit(1);
        }
      }
      
      console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
      cleanup(server);
      
    } catch (err) {
      console.error("❌ Test script error:", err);
      cleanup(server);
      process.exit(1);
    }
  });
}

function cleanup(server: any) {
  server.close(async () => {
    console.log("[TEST SERVER] Stopped.");
    await redisClient.disconnect();
    console.log("Redis disconnected.");
    process.exit(0);
  });
}

main().catch(console.error);
