import axios, { AxiosInstance } from "axios";
import { prisma } from "./utils/prisma";
import { BookingStatus } from "@canovet/shared";

const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "2562546246";
const TEST_OTP = "123456";

let client: AxiosInstance;
let accessToken: string;
let userId: string;

function ok(label: string) { console.log(`  ✅ ${label}`); }
function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  console.error(`  ❌ ${label}: ${msg}`);
}

async function login(): Promise<void> {
  await client.post("/auth/send-otp", { phone: TEST_PHONE });
  const res = await client.post("/auth/verify-otp", { phone: TEST_PHONE, code: TEST_OTP });
  accessToken = res.data.accessToken;
  const me = await client.get("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  userId = me.data.id;
}

async function main() {
  console.log("\n🧪 BOOKING RESCHEDULING & PARTNER RE-ASSIGNMENT TESTS\n");

  client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true,
  });

  try {
    await login();
    ok(`Logged in as User ID: ${userId}`);
  } catch (err) {
    fail("Login failed", err);
    process.exit(1);
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // Fetch or create user pets & addresses
  await client.get("/booking/test-data", { headers: authHeaders });

  const pet = await prisma.pet.findFirst({ where: { userId } });
  const address = await prisma.address.findFirst({ where: { userId } });
  const city = await prisma.city.findFirst();

  if (!pet || !address || !city) {
    console.error("  ❌ Missing test data (pet, address, or city). Run seed/test-data first.");
    process.exit(1);
  }

  // Seeding test partners A and B in the same city close to the address
  console.log("📋 Seeding Test Partners A and B...");
  const partnerA = await prisma.partner.upsert({
    where: { phone: "9999999901" },
    update: {
      isOnline: true,
      isVerified: true,
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      activeBookings: 0,
    },
    create: {
      name: "Partner A (Test)",
      phone: "9999999901",
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      isOnline: true,
      isVerified: true,
      activeBookings: 0,
    },
  });

  const partnerB = await prisma.partner.upsert({
    where: { phone: "9999999902" },
    update: {
      isOnline: true,
      isVerified: true,
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      activeBookings: 0,
    },
    create: {
      name: "Partner B (Test)",
      phone: "9999999902",
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      isOnline: true,
      isVerified: true,
      activeBookings: 0,
    },
  });

  // Ensure they offer the VET_ON_CALL service
  await prisma.partnerService.upsert({
    where: { id: `service-a-vet` },
    update: { partnerId: partnerA.id, serviceType: "VET_ON_CALL" },
    create: { id: `service-a-vet`, partnerId: partnerA.id, serviceType: "VET_ON_CALL" },
  });

  await prisma.partnerService.upsert({
    where: { id: `service-b-vet` },
    update: { partnerId: partnerB.id, serviceType: "VET_ON_CALL" },
    create: { id: `service-b-vet`, partnerId: partnerB.id, serviceType: "VET_ON_CALL" },
  });

  ok("Test Partners seeded.");

  // Clean up any existing active bookings/reschedule logs to start fresh
  await prisma.rescheduleLog.deleteMany({ where: { userId } });
  await prisma.booking.deleteMany({
    where: {
      userId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT] },
    },
  });

  // Create active booking assigned to Partner A
  console.log("\n── Test 1: Reschedule booking (same partner available) ──");
  const slot1Start = new Date();
  slot1Start.setHours(slot1Start.getHours() + 3, 0, 0, 0); // 3 hours in future
  const slot1End = new Date(slot1Start);
  slot1End.setHours(slot1Start.getHours() + 2);

  const booking = await prisma.booking.create({
    data: {
      userId,
      cityId: city.id,
      petId: pet.id,
      addressId: address.id,
      serviceType: "VET_ON_CALL",
      status: BookingStatus.CONFIRMED,
      slotStart: slot1Start,
      slotEnd: slot1End,
      partnerId: partnerA.id,
    },
  });

  // Set Partner A active bookings to 1
  await prisma.partner.update({
    where: { id: partnerA.id },
    data: { activeBookings: 1 },
  });

  // Reschedule to slot 2 (Partner A is free)
  const slot2Start = new Date();
  slot2Start.setHours(slot2Start.getHours() + 6, 0, 0, 0); // 6 hours in future
  const slot2End = new Date(slot2Start);
  slot2End.setHours(slot2Start.getHours() + 2);

  try {
    const res = await client.post(
      `/booking/${booking.id}/reschedule`,
      { slotStart: slot2Start.toISOString(), slotEnd: slot2End.toISOString() },
      { headers: authHeaders }
    );

    if (res.status === 200 && res.data.partnerId === partnerA.id) {
      ok("Successfully rescheduled. Original partner was kept.");
    } else {
      fail("Failed to keep original partner", res.data);
    }
  } catch (err) {
    fail("Test 1 error", err);
  }

  console.log("\n── Test 2: Reschedule booking (partner change / conflict) ──");
  // Create conflict for Partner A in slot 3
  const slot3Start = new Date();
  slot3Start.setDate(slot3Start.getDate() + 1);
  slot3Start.setHours(10, 0, 0, 0);
  const slot3End = new Date(slot3Start);
  slot3End.setHours(12, 0, 0, 0);

  // Conflicting booking for Partner A
  const conflictBooking = await prisma.booking.create({
    data: {
      userId,
      cityId: city.id,
      petId: pet.id,
      addressId: address.id,
      serviceType: "VET_ON_CALL",
      status: BookingStatus.CONFIRMED,
      slotStart: slot3Start,
      slotEnd: slot3End,
      partnerId: partnerA.id,
    },
  });

  try {
    const res = await client.post(
      `/booking/${booking.id}/reschedule`,
      { slotStart: slot3Start.toISOString(), slotEnd: slot3End.toISOString() },
      { headers: authHeaders }
    );

    if (res.status === 200 && res.data.partnerId === partnerB.id) {
      ok("Successfully rescheduled. Partner changed to B due to A's conflict.");

      // Check load balancer adjustments
      const updatedPartnerA = await prisma.partner.findUnique({ where: { id: partnerA.id } });
      const updatedPartnerB = await prisma.partner.findUnique({ where: { id: partnerB.id } });

      if (updatedPartnerA?.activeBookings === 0 && updatedPartnerB?.activeBookings === 1) {
        ok("Partner activeBookings counts correctly adjusted (A=0, B=1).");
      } else {
        fail("Partner activeBookings not updated properly", { A: updatedPartnerA?.activeBookings, B: updatedPartnerB?.activeBookings });
      }
    } else {
      fail("Failed to switch partner or reschedule", res.data);
    }
  } catch (err) {
    fail("Test 2 error", err);
  } finally {
    // Delete conflict booking
    await prisma.booking.delete({ where: { id: conflictBooking.id } });
  }

  console.log("\n── Test 3: Reschedule rate limiting (max 2 per day) ──");
  // We have done 2 reschedules so far (Test 1 and Test 2).
  // The 3rd reschedule should be blocked.
  const slot4Start = new Date();
  slot4Start.setDate(slot4Start.getDate() + 2);
  slot4Start.setHours(10, 0, 0, 0);
  const slot4End = new Date(slot4Start);
  slot4End.setHours(12, 0, 0, 0);

  try {
    const res = await client.post(
      `/booking/${booking.id}/reschedule`,
      { slotStart: slot4Start.toISOString(), slotEnd: slot4End.toISOString() },
      { headers: authHeaders }
    );

    if (res.status === 400 && res.data.error?.includes("limit reached")) {
      ok(`Blocked by rate limiting: "${res.data.error}"`);
    } else {
      fail(`Expected rate limit blocking (400) but got status=${res.status}`, res.data);
    }
  } catch (err) {
    fail("Test 3 error", err);
  }

  console.log("\n── Test 4: Security / Ownership ──");
  await prisma.user.deleteMany({ where: { phone: "9999999999" } });
  const otherUser = await prisma.user.create({
    data: {
      phone: "9999999999",
      name: "Other User",
    },
  });

  const randomBooking = await prisma.booking.create({
    data: {
      userId: otherUser.id,
      cityId: city.id,
      petId: pet.id,
      addressId: address.id,
      serviceType: "VET_ON_CALL",
      status: BookingStatus.CONFIRMED,
      slotStart: slot4Start,
      slotEnd: slot4End,
    },
  });

  try {
    const res = await client.post(
      `/booking/${randomBooking.id}/reschedule`,
      { slotStart: slot4Start.toISOString(), slotEnd: slot4End.toISOString() },
      { headers: authHeaders }
    );

    if (res.status === 404 && res.data.error?.includes("not found")) {
      ok("Other user's booking rescheduling rejected with 404.");
    } else {
      fail(`Expected 404 for other user's booking, got status=${res.status}`, res.data);
    }
  } catch (err) {
    fail("Test 4 error", err);
  } finally {
    await prisma.booking.delete({ where: { id: randomBooking.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  }

  console.log("\n── Test 5: No partner available ──");
  // Temporarily reset reschedule limit in DB to allow this check
  await prisma.rescheduleLog.deleteMany({ where: { userId } });

  // Store original state of online partners
  const originalOnlinePartners = await prisma.partner.findMany({
    where: { isOnline: true },
    select: { id: true },
  });
  const originalOnlineIds = originalOnlinePartners.map(p => p.id);

  // Make all partners offline
  await prisma.partner.updateMany({
    data: { isOnline: false },
  });

  try {
    const res = await client.post(
      `/booking/${booking.id}/reschedule`,
      { slotStart: slot4Start.toISOString(), slotEnd: slot4End.toISOString() },
      { headers: authHeaders }
    );

    if (res.status === 400 && res.data.error?.includes("No partners available")) {
      ok(`Successfully rejected reschedule with error: "${res.data.error}"`);

      // Verify the booking slot and partner was NOT changed
      const currentBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      if (currentBooking?.partnerId === partnerB.id && currentBooking?.slotStart.getTime() === slot3Start.getTime()) {
        ok("Booking details correctly rolled back / unchanged.");
      } else {
        fail("Booking details were mutated despite failure", currentBooking);
      }
    } else {
      fail(`Expected rejection (400) for no partners, got status=${res.status}`, res.data);
    }
  } catch (err) {
    fail("Test 5 error", err);
  } finally {
    // Restore original online status of partners
    await prisma.partner.updateMany({
      where: { id: { in: originalOnlineIds } },
      data: { isOnline: true },
    });
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test bookings and partners...");
  await prisma.rescheduleLog.deleteMany({ where: { userId } });
  await prisma.booking.deleteMany({ where: { userId } });
  await prisma.partnerService.deleteMany({ where: { partnerId: { in: [partnerA.id, partnerB.id] } } });
  await prisma.partner.deleteMany({ where: { id: { in: [partnerA.id, partnerB.id] } } });
  ok("Cleanup complete.");

  console.log("\n🎉 ALL RESCHEDULING & RE-ASSIGNMENT TESTS COMPLETE\n");
}

main().catch(console.error);
