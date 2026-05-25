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
  console.log("\n🧪 UNIFIED 4-DIGIT OTP OPERATIONS FLOW TESTS\n");

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

  // Seeding a test partner
  console.log("📋 Seeding Test Partner...");
  const partner = await prisma.partner.upsert({
    where: { phone: "9999999999" },
    update: {
      isOnline: true,
      isVerified: true,
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      activeBookings: 0,
      totalCompleted: 0,
      todayCompletedBookings: 0,
    },
    create: {
      name: "OTP Test Partner",
      phone: "9999999999",
      cityId: city.id,
      latitude: address.latitude,
      longitude: address.longitude,
      isOnline: true,
      isVerified: true,
      activeBookings: 0,
      totalCompleted: 0,
      todayCompletedBookings: 0,
    },
  });

  await prisma.partnerService.upsert({
    where: { id: `service-otp-grooming` },
    update: { partnerId: partner.id, serviceType: "GROOMING" },
    create: { id: `service-otp-grooming`, partnerId: partner.id, serviceType: "GROOMING" },
  });

  ok("Test Partner seeded.");

  // Clean up any existing active bookings to start fresh
  await prisma.booking.deleteMany({
    where: {
      userId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT, BookingStatus.CHECKED_IN] },
    },
  });

  console.log("\n── Test 1: Create booking and verify OTP generation ──");
  const slotStart = new Date();
  slotStart.setDate(slotStart.getDate() + 1); // Grooming must be next day
  slotStart.setHours(10, 0, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(12, 0, 0, 0);

  const createRes = await client.post(
    "/booking",
    {
      serviceType: "GROOMING",
      petId: pet.id,
      addressId: address.id,
      cityId: city.id,
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
      preferredPartnerId: partner.id,
    },
    { headers: authHeaders }
  );

  if (createRes.status !== 200) {
    fail("Failed to create booking", createRes.data);
    process.exit(1);
  }

  const booking = createRes.data;
  const otp = booking.verificationOtp;

  if (otp && typeof otp === "string" && otp.length === 4) {
    ok(`Booking created successfully. Generated 4-digit verificationOtp: ${otp}`);
  } else {
    fail("Verification OTP was not generated correctly", booking);
    process.exit(1);
  }

  console.log("\n── Test 2: Verify Check-in with OTP ──");
  
  // Try check-in with invalid OTP
  const badCheckinRes = await client.post(
    `/booking/${booking.id}/check-in`,
    { verificationOtp: "0000" },
    { headers: authHeaders }
  );

  if (badCheckinRes.status === 400 && badCheckinRes.data.error?.includes("Invalid")) {
    ok("Check-in rejected correctly with invalid OTP");
  } else {
    fail(`Expected invalid OTP check-in rejection, got status: ${badCheckinRes.status}`, badCheckinRes.data);
  }

  // Try check-in with correct OTP
  const goodCheckinRes = await client.post(
    `/booking/${booking.id}/check-in`,
    { verificationOtp: otp },
    { headers: authHeaders }
  );

  if (goodCheckinRes.status === 200 && goodCheckinRes.data.booking?.status === BookingStatus.CHECKED_IN) {
    ok("Checked in successfully with correct OTP");
  } else {
    fail(`Failed check-in with correct OTP, got status: ${goodCheckinRes.status}`, goodCheckinRes.data);
  }

  console.log("\n── Test 3: Verify Completion with OTP ──");

  // Try completion with invalid OTP
  const badCompleteRes = await client.post(
    `/booking/${booking.id}/complete`,
    { verificationOtp: "0000" },
    { headers: authHeaders }
  );

  if (badCompleteRes.status === 400 && badCompleteRes.data.error?.includes("Invalid")) {
    ok("Completion rejected correctly with invalid OTP");
  } else {
    fail(`Expected invalid OTP completion rejection, got status: ${badCompleteRes.status}`, badCompleteRes.data);
  }

  // Set partner active bookings for stats check
  await prisma.partner.update({
    where: { id: partner.id },
    data: { activeBookings: 1 },
  });

  // Try completion with correct OTP
  const goodCompleteRes = await client.post(
    `/booking/${booking.id}/complete`,
    { verificationOtp: otp },
    { headers: authHeaders }
  );

  if (goodCompleteRes.status === 200 && goodCompleteRes.data.booking?.status === BookingStatus.COMPLETED) {
    ok("Completed successfully with correct OTP");

    // Verify partner stats updated
    const updatedPartner = await prisma.partner.findUnique({ where: { id: partner.id } });
    if (
      updatedPartner?.activeBookings === 0 &&
      updatedPartner?.totalCompleted === 1 &&
      updatedPartner?.todayCompletedBookings === 1
    ) {
      ok("Partner stats adjusted correctly (active=0, total=1, today=1)");
    } else {
      fail("Partner stats not updated correctly", updatedPartner);
    }
  } else {
    fail(`Failed completion with correct OTP, got status: ${goodCompleteRes.status}`, goodCompleteRes.data);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test bookings and partners...");
  await prisma.booking.deleteMany({ where: { userId } });
  await prisma.partnerService.deleteMany({ where: { partnerId: partner.id } });
  await prisma.partner.deleteMany({ where: { id: partner.id } });
  ok("Cleanup complete.");

  console.log("\n🎉 ALL OTP TESTS COMPLETE\n");
}

main().catch(console.error);
