# Authentication Verification Guide

This guide details how to verify the Canovet authentication system, token rotation, rate limits, and server-side logouts both **manually** and **automatically**.

---

## 1. Automated (Unmanual) Verification
We use a Node/TypeScript testing script that simulates client requests and queries Redis memory to verify session lifetimes and security.

### How to Run:
Run the script from the `backend/` directory:
```bash
cd backend
npx ts-node src/scripts/test-auth-flow.ts
```

### What the Script Verifies:
1. **OTP Rate Limiting:** Requests `/auth/send-otp` twice in a row. Verifies that the second attempt (within 1 minute) is blocked with status code `429 Too Many Requests`. Also checks that the 24-hour window cap of 5 OTP requests works.
2. **User Registration & OTP verification:** Sends OTP to a new phone, verifies it using code `1234`, and verifies it returns an Access Token, a Refresh Token, and user object.
3. **Redis Session Storage:** Connects to Redis to confirm that `sess:${userId}:${signatureHash}` exists and is configured with a 7-day TTL.
4. **Access Verification:** Queries `/auth/me` with the access token. Verifies status code `200 OK`.
5. **Token Rotation (Refresh):** Requests `/auth/refresh`. Verifies that:
   * The server returns a new Access Token & Refresh Token.
   * The old session key is deleted from Redis.
   * A new session key is created in Redis.
6. **Token Revocation (Logout):** Requests `/auth/logout` with the active refresh token. Verifies that:
   * The session key is deleted from Redis.
   * Accessing `/auth/me` with the previous access token fails.
   * Accessing `/auth/refresh` with the logged-out refresh token is rejected.

---

## 2. Manual Verification

### A. Testing OTP & Database Bypass
1. Start your backend server: `npm run dev:backend`.
2. Fire a POST request to send an OTP:
   ```bash
   curl -X POST http://localhost:5000/auth/send-otp -H "Content-Type: application/json" -d '{"phone": "+919999999999"}'
   ```
3. Open your Redis console (CLI) and run:
   ```bash
   keys otp:*
   ```
   You should see `otp:+919999999999` in memory.
4. Verify the OTP:
   ```bash
   curl -X POST http://localhost:5000/auth/verify-otp -H "Content-Type: application/json" -d '{"phone": "+919999999999", "otp": "1234", "platform": "mobile"}'
   ```
5. Check your Redis console again: `keys otp:*` should return empty (key deleted).

### B. Testing Token Rotation & Session Cache
1. When you verify the OTP in Step 4, copy the `accessToken` and `refreshToken` from the JSON response.
2. Check if the session is cached in Redis:
   ```bash
   keys sess:*
   ```
   You will see a key matching `sess:<userId>:<signatureHash>`.
3. Check its time-to-live:
   ```bash
   ttl sess:<userId>:<signatureHash>
   ```
   It should return a number close to `604800` (7 days in seconds).
4. Perform a token refresh:
   ```bash
   curl -X POST http://localhost:5000/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
   ```
5. Observe:
   * The server returns a new `accessToken` and `refreshToken`.
   * Running `keys sess:*` in Redis will show that the old key was deleted and replaced by a new session key signature.

### C. Testing Secure Logout (Revocation)
1. Send a POST request to logout, passing the active refresh token:
   ```bash
   curl -X POST http://localhost:5000/auth/logout -H "Content-Type: application/json" -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
   ```
2. Verify Redis keys:
   ```bash
   keys sess:*
   ```
   The session key should be **completely gone**.
3. Try refreshing again using the same refresh token. The server will reject it with a `401 Unauthorized` error because it no longer exists in the Redis session cache.
