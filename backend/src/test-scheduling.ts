/**
 * TEST: Full matching + slot system
 *
 * Part A — Matching (geo + time + scoring)
 *   Case 1: Same time conflict → different partner
 *   Case 2: Far partner → NOT assigned
 *   Case 3: Multiple options → balanced scoring
 *
 * Part B — Slot availability
 *   Case 4: All 4 slots available initially
 *   Case 5: 10-12 blocked after both partners booked
 *   Case 6: Other windows still available
 */

import { prisma } from "./utils/prisma";
import { bookingService } from "./services/booking.service";
import { slotService } from "./services/slot.service";
import { BookingStatus } from "@canovet/shared";

const TEST_PREFIX = "TEST_FULL_";

async function cleanup() {
  await prisma.booking.deleteMany({ where: { userId: { startsWith: TEST_PREFIX } } });
  await prisma.partnerService.deleteMany({ where: { partnerId: { startsWith: TEST_PREFIX } } });
  await prisma.partner.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.pet.deleteMany({ where: { userId: { startsWith: TEST_PREFIX } } });
  await prisma.address.deleteMany({ where: { userId: { startsWith: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.city.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
}

async function main() {
  console.log("\n========================================");
  console.log("  FULL TEST SUITE");
  console.log("========================================\n");

  await cleanup();

  // ── SETUP ──
  const city = await prisma.city.create({
    data: { id: `${TEST_PREFIX}CITY`, name: "Mumbai", state: "MH" },
  });
  const user = await prisma.user.create({
    data: { id: `${TEST_PREFIX}USER`, phone: "9999966666" },
  });
  const pet = await prisma.pet.create({
    data: { id: `${TEST_PREFIX}PET`, userId: user.id, name: "Rex" },
  });
  const address = await prisma.address.create({
    data: {
      id: `${TEST_PREFIX}ADDR`,
      userId: user.id,
      text: "Mumbai Center",
      latitude: 19.076,
      longitude: 72.877,
    },
  });

  // A: 1 km, B: 3 km, C: 20 km
  const pA = await prisma.partner.create({
    data: {
      id: `${TEST_PREFIX}PA`, name: "Partner A", phone: "6666611111",
      cityId: city.id, latitude: 19.085, longitude: 72.877,
      isOnline: true, isVerified: true,
    },
  });
  await prisma.partnerService.create({ data: { partnerId: pA.id, serviceType: "GROOMING" } });

  const pB = await prisma.partner.create({
    data: {
      id: `${TEST_PREFIX}PB`, name: "Partner B", phone: "6666622222",
      cityId: city.id, latitude: 19.100, longitude: 72.877,
      isOnline: true, isVerified: true,
    },
  });
  await prisma.partnerService.create({ data: { partnerId: pB.id, serviceType: "GROOMING" } });

  const pC = await prisma.partner.create({
    data: {
      id: `${TEST_PREFIX}PC`, name: "Partner C", phone: "6666633333",
      cityId: city.id, latitude: 19.250, longitude: 72.877,
      isOnline: true, isVerified: true,
    },
  });
  await prisma.partnerService.create({ data: { partnerId: pC.id, serviceType: "GROOMING" } });

  const results: Record<string, boolean> = {};
  const t10Start = new Date("2026-07-15T10:00:00Z");
  const t10End = new Date("2026-07-15T12:00:00Z");

  // ═══ PART A: MATCHING ═══
  console.log("═══════════════════════════════════════");
  console.log("  PART A: MATCHING");
  console.log("═══════════════════════════════════════\n");

  // Case 1
  const b1 = await bookingService.createBooking({
    userId: user.id, cityId: city.id, serviceType: "GROOMING",
    petId: pet.id, addressId: address.id, slotStart: t10Start, slotEnd: t10End,
  });
  const b2 = await bookingService.createBooking({
    userId: user.id, cityId: city.id, serviceType: "GROOMING",
    petId: pet.id, addressId: address.id, slotStart: t10Start, slotEnd: t10End,
  });
  results["Case 1 (time conflict)"] = !!b1?.partnerId && !!b2?.partnerId && b1.partnerId !== b2.partnerId;
  console.log(`  Case 1: B1→${b1?.partnerId}, B2→${b2?.partnerId} | ${results["Case 1 (time conflict)"] ? "✅" : "❌"}`);

  // Case 2 — A & B busy, only C left but 20 km
  const b3 = await bookingService.createBooking({
    userId: user.id, cityId: city.id, serviceType: "GROOMING",
    petId: pet.id, addressId: address.id, slotStart: t10Start, slotEnd: t10End,
  });
  results["Case 2 (far partner)"] = b3?.status === "FAILED" && !b3?.partnerId;
  console.log(`  Case 2: status=${b3?.status}, partner=${b3?.partnerId ?? "NONE"} | ${results["Case 2 (far partner)"] ? "✅" : "❌"}`);

  // Case 3 — different time, A overloaded vs B balanced
  await prisma.partner.update({ where: { id: pA.id }, data: { activeBookings: 5, todayCompletedBookings: 3 } });
  await prisma.partner.update({ where: { id: pB.id }, data: { activeBookings: 0, todayCompletedBookings: 0 } });
  const t14Start = new Date("2026-07-15T14:00:00Z");
  const t14End = new Date("2026-07-15T16:00:00Z");
  const b4 = await bookingService.createBooking({
    userId: user.id, cityId: city.id, serviceType: "GROOMING",
    petId: pet.id, addressId: address.id, slotStart: t14Start, slotEnd: t14End,
  });
  results["Case 3 (scoring)"] = b4?.partnerId === pB.id;
  console.log(`  Case 3: partner=${b4?.partnerId} (expected ${pB.id}) | ${results["Case 3 (scoring)"] ? "✅" : "❌"}\n`);

  // ═══ PART B: SLOTS ═══
  console.log("═══════════════════════════════════════");
  console.log("  PART B: SLOTS");
  console.log("═══════════════════════════════════════\n");

  // Clean bookings for fresh slot test
  await prisma.booking.deleteMany({ where: { userId: user.id } });
  await prisma.partner.update({ where: { id: pA.id }, data: { activeBookings: 0, todayCompletedBookings: 0 } });
  await prisma.partner.update({ where: { id: pB.id }, data: { activeBookings: 0, todayCompletedBookings: 0 } });

  const testDate = new Date("2026-07-15T00:00:00");

  // Case 4
  const allSlots = await slotService.getAvailableSlots(testDate, city.id, "GROOMING", address.id);
  results["Case 4 (all slots)"] = allSlots.length === 4;
  console.log(`  Case 4: ${allSlots.length} slots | ${results["Case 4 (all slots)"] ? "✅" : "❌"}`);

  // Book both at 10 AM
  await prisma.booking.create({
    data: {
      userId: user.id, cityId: city.id, serviceType: "GROOMING",
      petId: pet.id, addressId: address.id,
      slotStart: new Date("2026-07-15T10:00:00"),
      slotEnd: new Date("2026-07-15T12:00:00"),
      partnerId: pA.id, status: BookingStatus.AWAITING_PAYMENT,
    },
  });
  await prisma.booking.create({
    data: {
      userId: user.id, cityId: city.id, serviceType: "GROOMING",
      petId: pet.id, addressId: address.id,
      slotStart: new Date("2026-07-15T10:00:00"),
      slotEnd: new Date("2026-07-15T12:00:00"),
      partnerId: pB.id, status: BookingStatus.CONFIRMED,
    },
  });

  // Case 5
  const slotsAfter = await slotService.getAvailableSlots(testDate, city.id, "GROOMING", address.id);
  const has10to12 = slotsAfter.some((s) => s.slotStart.getHours() === 10);
  results["Case 5 (10 AM blocked)"] = !has10to12 && slotsAfter.length === 3;
  console.log(`  Case 5: 10-12=${has10to12 ? "YES ❌" : "NO ✅"}, ${slotsAfter.length} slots | ${results["Case 5 (10 AM blocked)"] ? "✅" : "❌"}`);

  // Case 6
  const has12to14 = slotsAfter.some((s) => s.slotStart.getHours() === 12);
  const has14to16 = slotsAfter.some((s) => s.slotStart.getHours() === 14);
  results["Case 6 (adjacent ok)"] = has12to14 && has14to16;
  console.log(`  Case 6: 12-14=${has12to14 ? "✅" : "❌"}, 14-16=${has14to16 ? "✅" : "❌"} | ${results["Case 6 (adjacent ok)"] ? "✅" : "❌"}\n`);

  // ═══ SUMMARY ═══
  console.log("========================================");
  console.log("  SUMMARY");
  console.log("========================================");
  let allPass = true;
  for (const [name, pass] of Object.entries(results)) {
    console.log(`  ${pass ? "✅" : "❌"} ${name}`);
    if (!pass) allPass = false;
  }
  console.log(`\n  Overall: ${allPass ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
  console.log("========================================\n");

  await cleanup();
  console.log("✅ Cleaned up\n");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ ERROR:", err);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
