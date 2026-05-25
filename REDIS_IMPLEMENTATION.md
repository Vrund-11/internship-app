# Canovet: Redis Integration & Optimization Strategy

This document outlines the proposed strategy for integrating Redis into the Canovet architecture to improve latency, reduce database load, and enable real-time features.

## 1. Transient Data & OTP Management
**Current State:** OTPs (One-Time Passwords) are stored in the PostgreSQL database using the `OTP` Prisma model. This bloats the primary database with highly transient, short-lived data.
**Redis Implementation:**
- **Store OTPs in Redis:** Use Redis strings with an expiration time (`EX` flag set to 5 minutes). 
- **Key Structure:** `otp:{phoneNumber}` -> `{code}`
- **Rate Limiting:** Implement OTP rate limiting (e.g., max 3 OTP requests per 15 minutes per phone number) using Redis `INCR` and `EXPIRE`.

## 2. Authentication & Session Management
**Current State:** User sessions (`UserSession` model) are stored in PostgreSQL, requiring a database hit for every authenticated request or token refresh.
**Redis Implementation:**
- **Session Caching:** Move active session/refresh token whitelists to Redis.
- **Key Structure:** `session:{userId}:{sessionId}` -> `true` (with TTL matching the refresh token expiry).
- **Fast Revocation:** Logging out or invalidating a compromised session becomes an instant `DEL` command in Redis, significantly boosting security and API response times.

## 3. Partner Geospatial Tracking & Assignment
**Current State:** Partner assignment during the "Searching Partner" flow relies on SQL proximity queries or basic filtering (`isOnline = true`).
**Redis Implementation:**
- **Redis GEO:** Store active/online partners using Redis Geospatial commands (`GEOADD`).
- **Key Structure:** `partners:online:{cityId}` (containing longitude/latitude).
- **Radius Search:** When a booking is created, use `GEORADIUS` or `GEOSEARCH` to instantly find all online partners within a specific radius (e.g., 5km) of the user's coordinates.
- **Pub/Sub:** Use Redis Pub/Sub to broadcast real-time location updates of the assigned partner to the user's active WebSocket connection.

## 4. Slot Availability Caching
**Current State:** `generateSlots()` and `askSlots()` compute available timeslots dynamically, checking partner capacity against Postgres, which can be computationally expensive as booking volume grows.
**Redis Implementation:**
- **Pre-computed Slots:** Cache the available slots for a given day, city, and service type.
- **Key Structure:** `slots:{cityId}:{serviceType}:{YYYY-MM-DD}`
- **Cache Invalidation:** Whenever a new booking is confirmed, decrement the available slot count or invalidate the specific date's cache for that city/service.

## 5. Idempotency for Bookings & Payments
**Current State:** Risk of double-booking if a user taps "Confirm Booking" multiple times rapidly or network latency causes retries.
**Redis Implementation:**
- **Idempotency Keys:** Store a unique transaction ID (`idempotency_key`) from the client in Redis using `SETNX` (Set if Not eXists) with a short TTL (e.g., 24 hours). 
- If `SETNX` returns 0, the request is a duplicate and should be safely ignored or return the cached response of the initial successful request.

---
### Phase 1 Execution Plan (Starting Tomorrow)
1. **Infrastructure Setup:** Initialize Redis connection pool in `backend/src/utils/redis.ts` using the standard `redis` package already in `package.json`.
2. **Auth Refactor:** Migrate the `OTP` flow from Prisma (`authRepository.createOTP`, `findValidOTP`, `deleteOTP`) to Redis (`SET EX`, `GET`, `DEL`).
3. **Session Refactor:** Migrate `UserSession` tracking (`authRepository.createSession`) to Redis.
4. **Cleanup:** Remove `OTP` and `UserSession` models from `schema.prisma` and run a migration to clean up the PostgreSQL schema.
