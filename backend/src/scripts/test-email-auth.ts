import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import app from "../app";
import axios from "axios";
import { redisClient, connectRedis } from "../utils/redis";
import crypto from "crypto";
import { prisma } from "../utils/prisma";

const PORT = 5002;
const testUrl = `http://localhost:${PORT}`;

async function main() {
  console.log("🚀 Starting Automated Email/Password Authentication E2E Test Suite...");

  // 1. Connect Redis
  await connectRedis();

  // 2. Start Test Server
  const server = app.listen(PORT, async () => {
    console.log(`[TEST SERVER] Running on port ${PORT}`);

    try {
      const email = "vrundupadhyay1107@gmail.com";
      
      // Clean up user from previous test runs to ensure registration succeeds
      await prisma.user.deleteMany({
        where: { email },
      });

      // Clear any old reset tokens from Redis to avoid using a stale key in assertions
      const oldKeys = await redisClient.keys("password-reset:*");
      for (const k of oldKeys) {
        await redisClient.del(k);
      }

      const originalPassword = "OriginalPass123!";
      const newPassword = "NewPassWord789!";

      console.log(`\n--- Test 1: Unified Registration ---`);
      console.log(`Registering brand new user: ${email}`);
      const regRes = await axios.post(`${testUrl}/auth/login-signup`, {
        email,
        password: originalPassword,
        platform: "mobile",
      });

      const { user, accessToken, refreshToken } = regRes.data;
      console.log(`✅ SUCCESS: Registered successfully. User ID: ${user.id}, Email: ${user.email}`);

      if (!accessToken || !refreshToken) {
        console.log("❌ FAIL: Did not return tokens on registration!");
        process.exit(1);
      }

      console.log(`\n--- Test 2: Double Register / Unified Login (Correct Password) ---`);
      console.log(`Attempting login with correct password...`);
      const loginRes = await axios.post(`${testUrl}/auth/login-signup`, {
        email,
        password: originalPassword,
        platform: "mobile",
      });
      console.log(`✅ SUCCESS: Logged in successfully. Access token received: ${!!loginRes.data.accessToken}`);

      console.log(`\n--- Test 3: Unified Login (Incorrect Password) ---`);
      console.log(`Attempting login with incorrect password...`);
      try {
        await axios.post(`${testUrl}/auth/login-signup`, {
          email,
          password: "WrongPassword999!",
          platform: "mobile",
        });
        console.log("❌ FAIL: Login succeeded with incorrect password!");
        process.exit(1);
      } catch (err: any) {
        if (err.response?.status === 400) {
          console.log(`✅ SUCCESS: Correctly blocked with 400: "${err.response.data.error}"`);
        } else {
          console.log(`❌ FAIL: Expected 400, got:`, err.response?.status);
          process.exit(1);
        }
      }

      console.log(`\n--- Test 4: Forgot Password Request ---`);
      console.log(`Requesting forgot password reset email for: ${email}`);
      const forgotRes = await axios.post(`${testUrl}/auth/forgot-password`, { email });
      console.log(`Forgot Password Response:`, forgotRes.data);

      // Verify reset token is stored in Redis
      const resetKeys = await redisClient.keys("password-reset:*");
      if (resetKeys.length === 0) {
        console.log("❌ FAIL: Reset token was not stored in Redis!");
        process.exit(1);
      }

      const tokenKey = resetKeys[0];
      const token = tokenKey.split(":")[1];
      console.log(`✅ SUCCESS: Found reset token in Redis: "${token}"`);

      console.log(`\n--- Test 5: Verify Reset Token Validity ---`);
      const verifyTokenRes = await axios.post(`${testUrl}/auth/verify-reset-token`, { token });
      console.log(`Verify token response:`, verifyTokenRes.data);
      if (verifyTokenRes.data.valid === true) {
        console.log("✅ SUCCESS: Reset token is verified as valid.");
      } else {
        console.log("❌ FAIL: Reset token verified as invalid!");
        process.exit(1);
      }

      console.log(`\n--- Test 6: Reset Password Flow ---`);
      console.log(`Resetting password to: ${newPassword}`);
      const resetRes = await axios.post(`${testUrl}/auth/reset-password`, {
        token,
        password: newPassword,
      });
      console.log(`Reset Password Response:`, resetRes.data);
      if (resetRes.data.success) {
        console.log("✅ SUCCESS: Password reset endpoint returned success.");
      } else {
        console.log("❌ FAIL: Password reset failed.");
        process.exit(1);
      }

      // Check reset token deleted from Redis
      const deletedTokenExists = await redisClient.exists(tokenKey);
      if (deletedTokenExists === 0) {
        console.log("✅ SUCCESS: Reset token key cleaned up from Redis.");
      } else {
        console.log("❌ FAIL: Reset token key still in Redis!");
        process.exit(1);
      }

      console.log(`\n--- Test 7: Verify Old Credentials Fail ---`);
      try {
        await axios.post(`${testUrl}/auth/login-signup`, {
          email,
          password: originalPassword,
          platform: "mobile",
        });
        console.log("❌ FAIL: Old password still works after reset!");
        process.exit(1);
      } catch (err: any) {
        if (err.response?.status === 400) {
          console.log(`✅ SUCCESS: Old password correctly rejected.`);
        } else {
          console.log(`❌ FAIL: Expected 400, got:`, err.response?.status);
          process.exit(1);
        }
      }

      console.log(`\n--- Test 8: Verify New Credentials Work ---`);
      const newLoginRes = await axios.post(`${testUrl}/auth/login-signup`, {
        email,
        password: newPassword,
        platform: "mobile",
      });
      const newTokens = newLoginRes.data;
      console.log(`✅ SUCCESS: Logged in successfully with new password.`);

      console.log(`\n--- Test 9: Profile Retrieval ---`);
      const meRes = await axios.get(`${testUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${newTokens.accessToken}` },
      });
      console.log(`Profile User Email: ${meRes.data.email}`);
      if (meRes.data.email === email) {
        console.log("✅ SUCCESS: Profile fetched successfully using new access token.");
      } else {
        console.log("❌ FAIL: Email mismatch on profile.");
        process.exit(1);
      }

      console.log(`\n--- Test 10: Dev Sandbox Google Sign-in ---`);
      console.log("Requesting Google login with mock code...");
      const mockGoogleCode = `mock_google_code_google_user_${Math.floor(Math.random() * 100000)}@example.com`;
      const googleLoginRes = await axios.post(`${testUrl}/auth/google`, {
        code: mockGoogleCode,
        platform: "mobile",
      });
      const googleUser = googleLoginRes.data.user;
      console.log(`✅ SUCCESS: Sandbox Google login succeeded. ID: ${googleUser.id}, Email: ${googleUser.email}, Name: ${googleUser.name}`);

      console.log("\n🎉 ALL EMAIL/PASSWORD AUTH TESTS PASSED SUCCESSFULLY!");
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
