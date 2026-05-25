/**
 * TEST: Complaint & Support System
 *
 * Tests the unified feedback, review & dispute system:
 *   Case 1: Submit a complaint with booking → success
 *   Case 2: Submit a general complaint (no booking) → success
 *   Case 3: Rate limiting → 3rd complaint in same day → rejected
 *   Case 4: Regex classification → safety keyword → HIGH priority
 *   Case 5: Regex classification → fraud keyword → HIGH priority
 *   Case 6: Normal complaint → LOW/MEDIUM priority
 *   Case 7: 48-hour validation → complaint on old booking → rejected
 *   Case 8: Complaint without auth → 401
 */

import axios, { AxiosInstance } from "axios";
import { prisma } from "./utils/prisma";

const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "2562546246";
const TEST_OTP = "123456";

let client: AxiosInstance;
let accessToken: string;
let userId: string;
let testBookingId: string | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(label: string) { console.log(`  ✅ ${label}`); }
function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ❌ ${label}: ${msg}`);
}

async function login(): Promise<void> {
  // Send OTP
  await client.post("/auth/send-otp", { phone: TEST_PHONE });

  // Verify OTP — get token
  const res = await client.post("/auth/verify-otp", { phone: TEST_PHONE, code: TEST_OTP });
  accessToken = res.data.accessToken;

  // Get user ID
  const me = await client.get("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  userId = me.data.id;
}

async function cleanupTestComplaints(): Promise<void> {
  // Delete all complaints from today for this user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  await prisma.complaint.deleteMany({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  });
}

async function cleanupTestBookings(): Promise<void> {
  // Find all non-completed bookings for this user
  const nonCompletedBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: { not: "COMPLETED" },
    },
    select: { id: true, partnerId: true },
  });

  const bookingIds = nonCompletedBookings.map(b => b.id);

  if (bookingIds.length > 0) {
    await prisma.payment.deleteMany({
      where: { bookingId: { in: bookingIds } },
    });
    await prisma.complaint.deleteMany({
      where: { bookingId: { in: bookingIds } },
    });
    await prisma.booking.deleteMany({
      where: { id: { in: bookingIds } },
    });

    // Reset activeBookings on partners
    const partnerIds = nonCompletedBookings
      .map(b => b.partnerId)
      .filter((id): id is string => !!id);

    if (partnerIds.length > 0) {
      await prisma.partner.updateMany({
        where: { id: { in: partnerIds } },
        data: { activeBookings: 0 },
      });
    }
  }
}


async function getTestBookingId(): Promise<string | null> {
  // Find a completed booking for this user
  const booking = await prisma.booking.findFirst({
    where: { userId, status: "COMPLETED" },
    select: { id: true, slotEnd: true },
  });
  if (booking) return booking.id;

  // If no completed booking, find any booking
  const anyBooking = await prisma.booking.findFirst({
    where: { userId },
    select: { id: true },
  });
  return anyBooking?.id ?? null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("\n🧪 COMPLAINT & SUPPORT SYSTEM TESTS\n");

  client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true, // don't throw on 4xx/5xx
  });

  // Auth
  console.log("📋 Setup: Logging in...");
  try {
    await login();
    ok(`Logged in as ${userId}`);
  } catch (err) {
    fail("Login failed — cannot continue", err);
    return;
  }

  // Cleanup old test complaints
  await cleanupTestComplaints();
  await cleanupTestBookings();
  testBookingId = await getTestBookingId();
  console.log(`  ℹ️ Test booking ID: ${testBookingId ?? "NONE (will test general tickets only)"}\n`);

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // ── Case 1: Submit complaint with booking ──
  console.log("── Case 1: Submit complaint with booking ──");
  if (testBookingId) {
    try {
      const res = await client.post("/complaint", {
        bookingId: testBookingId,
        message: "The partner arrived 30 minutes late.",
        phone: TEST_PHONE,
        whatsapp: TEST_PHONE,
        category: "LATE",
      }, { headers: authHeaders });

      if (res.status === 200 && res.data.id) {
        ok(`Complaint created: ${res.data.id} (priority: ${res.data.priority})`);
      } else {
        fail("Unexpected response", res.data);
      }
    } catch (err) { fail("Case 1", err); }
  } else {
    console.log("  ⏭️ Skipped (no bookings)");
  }

  // ── Case 2: Submit general complaint (no booking) ──
  console.log("\n── Case 2: Submit general complaint (no booking) ──");
  try {
    const res = await client.post("/complaint", {
      message: "I cannot update my profile picture in the app.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "APP_ISSUE",
    }, { headers: authHeaders });

    if (res.status === 200 && res.data.id) {
      ok(`General ticket created: ${res.data.id} (priority: ${res.data.priority})`);
    } else {
      fail("Unexpected response", res.data);
    }
  } catch (err) { fail("Case 2", err); }

  // ── Case 3: Rate limiting — 3rd complaint today → rejected ──
  console.log("\n── Case 3: Rate limiting — 3rd complaint today → rejected ──");
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const currentTodayCount = await prisma.complaint.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });

    for (let i = currentTodayCount; i < 2; i++) {
      await client.post("/complaint", {
        message: `Filling up quota ${i}`,
        phone: TEST_PHONE,
        whatsapp: TEST_PHONE,
        category: "OTHER",
      }, { headers: authHeaders });
    }

    const res = await client.post("/complaint", {
      message: "Another issue with the app.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "OTHER",
    }, { headers: authHeaders });

    if (res.status === 400 && res.data.error?.includes("maximum limit")) {
      ok(`Rate limited: "${res.data.error}"`);
    } else {
      fail(`Expected rate limit rejection but got status=${res.status}`, res.data);
    }
  } catch (err) { fail("Case 3", err); }

  // Cleanup to test classification cases
  await cleanupTestComplaints();

  // ── Case 4: Regex classification — safety keyword → HIGH ──
  console.log("\n── Case 4: Regex — safety keyword → HIGH priority ──");
  try {
    const res = await client.post("/complaint", {
      message: "The partner threatened to hurt my pet and was very aggressive.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "SAFETY",
    }, { headers: authHeaders });

    if (res.status === 200 && res.data.priority === "HIGH") {
      ok(`Safety escalation detected (priority: ${res.data.priority})`);
    } else {
      fail(`Expected HIGH priority but got: ${res.data.priority}`, res.data);
    }
  } catch (err) { fail("Case 4", err); }

  // ── Case 5: Regex classification — fraud keyword → HIGH ──
  console.log("\n── Case 5: Regex — fraud keyword → HIGH priority ──");
  try {
    const res = await client.post("/complaint", {
      message: "The partner asked me to pay cash directly via gpay and scammed me.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "OVERCHARGING",
    }, { headers: authHeaders });

    if (res.status === 200 && res.data.priority === "HIGH") {
      ok(`Fraud escalation detected (priority: ${res.data.priority})`);
    } else {
      fail(`Expected HIGH priority but got: ${res.data.priority}`, res.data);
    }
  } catch (err) { fail("Case 5", err); }

  // Cleanup
  await cleanupTestComplaints();

  // ── Case 6: Normal complaint → LOW/MEDIUM priority ──
  console.log("\n── Case 6: Normal complaint → LOW/MEDIUM priority ──");
  try {
    const res = await client.post("/complaint", {
      message: "The grooming took longer than expected.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "OTHER",
    }, { headers: authHeaders });

    if (res.status === 200 && (res.data.priority === "LOW" || res.data.priority === "MEDIUM")) {
      ok(`Normal priority: ${res.data.priority}`);
    } else {
      fail(`Expected LOW/MEDIUM but got: ${res.data.priority}`, res.data);
    }
  } catch (err) { fail("Case 6", err); }

  // Cleanup
  await cleanupTestComplaints();

  // ── Case 7: 48-hour validation ──
  console.log("\n── Case 7: 48-hour validation — old booking → rejected ──");
  // Find a booking with slotEnd > 48 hours ago
  const oldBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      slotEnd: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (oldBooking) {
    try {
      const res = await client.post("/complaint", {
        bookingId: oldBooking.id,
        message: "Late complaint about an old booking.",
        phone: TEST_PHONE,
        whatsapp: TEST_PHONE,
        category: "LATE",
      }, { headers: authHeaders });

      if (res.status === 400 && res.data.error?.includes("48 hours")) {
        ok(`48h rule enforced: "${res.data.error}"`);
      } else {
        fail(`Expected 48h rejection but got status=${res.status}`, res.data);
      }
    } catch (err) { fail("Case 7", err); }
  } else {
    console.log("  ⏭️ Skipped (no old completed bookings)");
  }

  // ── Case 8: Complaint without auth → 401 ──
  console.log("\n── Case 8: Complaint without auth → 401 ──");
  try {
    const res = await client.post("/complaint", {
      message: "Unauthorized complaint attempt.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "OTHER",
    });

    if (res.status === 401) {
      ok("Unauthorized correctly rejected");
    } else {
      fail(`Expected 401 but got ${res.status}`, res.data);
    }
  } catch (err) { fail("Case 8", err); }

  // ── Case 9: Get user complaints list ──
  console.log("\n── Case 9: Get user complaints list ──");
  try {
    // Create one complaint first
    await client.post("/complaint", {
      message: "Testing list complaint route.",
      phone: TEST_PHONE,
      whatsapp: TEST_PHONE,
      category: "OTHER",
    }, { headers: authHeaders });

    const res = await client.get("/complaint", { headers: authHeaders });
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      ok(`Complaints listed successfully, count: ${res.data.length}`);
    } else {
      fail("Failed to list complaints", res.data);
    }
  } catch (err) { fail("Case 9", err); }

  // ── Case 10: Booking free cancellation (>8 hours) ──
  console.log("\n── Case 10: Booking free cancellation (>8 hours) ──");
  try {
    const testDataRes = await client.get("/booking/test-data", { headers: authHeaders });
    const pet = testDataRes.data.pets[0];
    const address = testDataRes.data.addresses[0];
    const city = await prisma.city.findFirst();
    const cityId = city?.id;

    if (pet && address && cityId) {
      // Create a booking 2 days in the future
      const start = new Date();
      start.setDate(start.getDate() + 2);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(12, 0, 0, 0);

      const bookingRes = await client.post("/booking", {
        serviceType: "GROOMING",
        petId: pet.id,
        addressId: address.id,
        cityId,
        slotStart: start.toISOString(),
        slotEnd: end.toISOString(),
      }, { headers: authHeaders });

      if (bookingRes.status === 200 && bookingRes.data.id) {
        const bookingId = bookingRes.data.id;
        // Seed a payment for this booking
        await prisma.payment.create({
          data: {
            bookingId,
            amount: 1000,
            status: "PAID",
          }
        });

        const cancelRes = await client.post(`/booking/${bookingId}/cancel`, {}, { headers: authHeaders });
        if (
          cancelRes.status === 200 &&
          cancelRes.data.isFreeCancellation === true &&
          cancelRes.data.refundAmount === 1000 &&
          cancelRes.data.booking.status === "CANCELLED"
        ) {
          ok("Free cancellation (>8h) succeeded and refunded 100%");
        } else {
          fail("Free cancellation checks failed", JSON.stringify(cancelRes.data));
        }
      } else {
        fail("Failed to create booking for free cancellation test", JSON.stringify(bookingRes.data));
      }
    } else {
      console.log("  ⏭️ Skipped (insufficient test data)");
    }
  } catch (err) { fail("Case 10", err); }

  // ── Case 11: Booking cancellation with penalty (<8 hours) ──
  console.log("\n── Case 11: Booking cancellation with penalty (<8 hours) ──");
  try {
    const testDataRes = await client.get("/booking/test-data", { headers: authHeaders });
    const pet = testDataRes.data.pets[0];
    const address = testDataRes.data.addresses[0];
    const city = await prisma.city.findFirst();
    const cityId = city?.id;

    if (pet && address && cityId) {
      // Create a booking in the next 2 hours (not GROOMING to bypass day-ahead validation)
      const start = new Date();
      start.setHours(start.getHours() + 2);
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      const bookingRes = await client.post("/booking", {
        serviceType: "VET_ON_CALL",
        petId: pet.id,
        addressId: address.id,
        cityId,
        slotStart: start.toISOString(),
        slotEnd: end.toISOString(),
      }, { headers: authHeaders });

      if (bookingRes.status === 200 && bookingRes.data.id) {
        const bookingId = bookingRes.data.id;
        // Seed a payment for this booking
        await prisma.payment.create({
          data: {
            bookingId,
            amount: 1000,
            status: "PAID",
          }
        });

        const cancelRes = await client.post(`/booking/${bookingId}/cancel`, {}, { headers: authHeaders });
        if (
          cancelRes.status === 400 &&
          cancelRes.data.error?.includes("Cannot cancel booking within 8 hours")
        ) {
          ok("Cancellation within 8h correctly blocked with descriptive error");
        } else {
          fail("Expected cancellation to be blocked but got status=" + cancelRes.status, JSON.stringify(cancelRes.data));
        }
      } else {
        fail("Failed to create booking for penalty cancellation test", JSON.stringify(bookingRes.data));
      }
    } else {
      console.log("  ⏭️ Skipped (insufficient test data)");
    }
  } catch (err) { fail("Case 11", err); }

  // Cleanup
  await cleanupTestComplaints();
  await cleanupTestBookings();

  console.log("\n✅ ALL COMPLAINT & CANCELLATION TESTS COMPLETE\n");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
