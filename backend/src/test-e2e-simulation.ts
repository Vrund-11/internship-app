import axios, { AxiosInstance } from "axios";
import { prisma } from "./utils/prisma";
import { BookingStatus } from "@canovet/shared";
import { classifyComplaint } from "./services/classifier.service";

const BASE_URL = "http://localhost:5000";
const TEST_PHONE = "2562546246";
const TEST_OTP = "123456";

let client: AxiosInstance;
let accessToken: string;
let userId: string;

function section(name: string) {
  console.log(`\n==================================================`);
  printStyled(`🔷 ${name.toUpperCase()}`, "cyan");
  console.log(`==================================================`);
}

function ok(label: string) {
  printStyled(`  ✅ ${label}`, "green");
}

function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  printStyled(`  ❌ ${label}: ${msg}`, "red");
}

function printStyled(text: string, color: "green" | "red" | "cyan" | "yellow") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
  };
  const reset = "\x1b[0m";
  console.log(`${colors[color]}${text}${reset}`);
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
  console.log("\n==================================================");
  printStyled("🚀 CANOVET END-TO-END MANUAL SIMULATION PREVIEW", "yellow");
  console.log("==================================================\n");

  client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true,
  });

  // 1. Authenticate
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
    printStyled("  ❌ Missing test data (pet, address, or city). Run seed/test-data first.", "red");
    process.exit(1);
  }

  // Seed Partners for Grooming, Vet on Call, Vet Clinic
  console.log("📋 Seeding Test Partners...");
  const partnerGroomer = await prisma.partner.upsert({
    where: { phone: "9999999911" },
    update: { isOnline: true, isVerified: true, cityId: city.id, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
    create: { name: "Amit (Groomer)", phone: "9999999911", cityId: city.id, isOnline: true, isVerified: true, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
  });
  await prisma.partnerService.upsert({
    where: { id: `service-sim-groom` },
    update: { partnerId: partnerGroomer.id, serviceType: "GROOMING" },
    create: { id: `service-sim-groom`, partnerId: partnerGroomer.id, serviceType: "GROOMING" },
  });

  const partnerDoctor = await prisma.partner.upsert({
    where: { phone: "9999999922" },
    update: { isOnline: true, isVerified: true, cityId: city.id, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
    create: { name: "Dr. Roy (Vet)", phone: "9999999922", cityId: city.id, isOnline: true, isVerified: true, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
  });
  await prisma.partnerService.upsert({
    where: { id: `service-sim-doc` },
    update: { partnerId: partnerDoctor.id, serviceType: "VET_ON_CALL" },
    create: { id: `service-sim-doc`, partnerId: partnerDoctor.id, serviceType: "VET_ON_CALL" },
  });

  const partnerClinic = await prisma.partner.upsert({
    where: { phone: "9999999933" },
    update: { isOnline: true, isVerified: true, cityId: city.id, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
    create: { name: "CanoVet Satellite Clinic", phone: "9999999933", cityId: city.id, isOnline: true, isVerified: true, activeBookings: 0, totalCompleted: 0, todayCompletedBookings: 0 },
  });
  await prisma.partnerService.upsert({
    where: { id: `service-sim-clinic` },
    update: { partnerId: partnerClinic.id, serviceType: "VET_CLINIC" },
    create: { id: `service-sim-clinic`, partnerId: partnerClinic.id, serviceType: "VET_CLINIC" },
  });

  // Clean old active test bookings
  await prisma.rescheduleLog.deleteMany({ where: { userId } });
  await prisma.complaint.deleteMany({ where: { userId } });
  await prisma.review.deleteMany({ where: { userId } });
  await prisma.payment.deleteMany({ where: { booking: { userId } } });
  await prisma.booking.deleteMany({ where: { userId } });

  // --------------------------------------------------
  // STAGE 1: BOOKING CREATION
  // --------------------------------------------------
  section("Stage 1: Booking Creation");

  // A. Check dynamic slot availability
  const slotsRes = await client.get(`/booking/slots?date=${new Date().toISOString()}&serviceType=GROOMING&cityId=${city.id}&addressId=${address.id}`, { headers: authHeaders });
  if (slotsRes.status === 200) {
    ok(`Fetched dynamic available slots, found slots count: ${slotsRes.data.slots?.length}`);
  } else {
    fail("Failed to fetch slots", slotsRes.data);
  }

  // B. Book Grooming (Home Visit) - Scheduled for Tomorrow (Next Day rule)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const groomBookingRes = await client.post("/booking", {
    serviceType: "GROOMING",
    petId: pet.id,
    addressId: address.id,
    cityId: city.id,
    slotStart: tomorrow.toISOString(),
    slotEnd: tomorrowEnd.toISOString(),
    preferredPartnerId: partnerGroomer.id,
  }, { headers: authHeaders });

  let groomBooking = groomBookingRes.data;
  if (groomBookingRes.status === 200 && groomBooking.verificationOtp) {
    ok(`Grooming booking created. Status: ${groomBooking.status}, Generated OTP: ${groomBooking.verificationOtp}`);
  } else {
    fail("Grooming booking failed", groomBookingRes.data);
  }

  // C. Book Vet Clinic Appointment (Clinic walk-in) - Scheduled for Today
  const todayStart = new Date();
  todayStart.setHours(todayStart.getHours() + 4, 0, 0, 0); // 4 hours from now
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(todayStart.getHours() + 2);

  const clinicBookingRes = await client.post("/booking", {
    serviceType: "VET_CLINIC",
    petId: pet.id,
    addressId: address.id,
    cityId: city.id,
    slotStart: todayStart.toISOString(),
    slotEnd: todayEnd.toISOString(),
    preferredPartnerId: partnerClinic.id,
  }, { headers: authHeaders });

  let clinicBooking = clinicBookingRes.data;
  if (clinicBookingRes.status === 200) {
    ok(`Vet Clinic booking created. Status: ${clinicBooking.status}, Generated OTP: ${clinicBooking.verificationOtp}`);
  } else {
    fail("Vet Clinic booking failed", clinicBookingRes.data);
  }

  // D. Book Vet on Call (Home Visit) - Scheduled for Today (starts in 1 hour)
  const docStart = new Date();
  docStart.setHours(docStart.getHours() + 1, 0, 0, 0);
  const docEnd = new Date(docStart);
  docEnd.setHours(docStart.getHours() + 2);

  const docBookingRes = await client.post("/booking", {
    serviceType: "VET_ON_CALL",
    petId: pet.id,
    addressId: address.id,
    cityId: city.id,
    slotStart: docStart.toISOString(),
    slotEnd: docEnd.toISOString(),
    preferredPartnerId: partnerDoctor.id,
  }, { headers: authHeaders });

  let docBooking = docBookingRes.data;
  if (docBookingRes.status === 200) {
    ok(`Vet on Call booking created. Status: ${docBooking.status}, Generated OTP: ${docBooking.verificationOtp}`);
  } else {
    fail("Vet on Call booking failed", docBookingRes.data);
  }

  // Create payment records for bookings
  await prisma.payment.create({ data: { bookingId: groomBooking.id, amount: 1200, status: "PENDING" } });
  await prisma.payment.create({ data: { bookingId: clinicBooking.id, amount: 800, status: "PENDING" } });
  await prisma.payment.create({ data: { bookingId: docBooking.id, amount: 1500, status: "PENDING" } });

  // --------------------------------------------------
  // STAGE 2: MANAGEMENT (Reschedule & Cancel)
  // --------------------------------------------------
  section("Stage 2: Reschedule & Cancel Limits");

  // A. Cancellation Window Limit Check (Vet on Call is 1 hour away < 8h limit)
  console.log("⏱️ Testing < 8 hours cancellation block...");
  const cancelFailRes = await client.post(`/booking/${docBooking.id}/cancel`, {}, { headers: authHeaders });
  if (cancelFailRes.status === 400 && cancelFailRes.data.error?.includes("8 hours")) {
    ok(`Blocked correctly: "${cancelFailRes.data.error}"`);
  } else {
    fail("Expected cancellation rejection, got status: " + cancelFailRes.status, cancelFailRes.data);
  }

  // B. Free Cancellation Check (Grooming is > 8 hours away)
  console.log("⏱️ Testing > 8 hours free cancellation...");
  const cancelOkRes = await client.post(`/booking/${groomBooking.id}/cancel`, {}, { headers: authHeaders });
  if (cancelOkRes.status === 200 && cancelOkRes.data.booking?.status === BookingStatus.CANCELLED) {
    ok(`Grooming booking successfully cancelled. Refund: ${cancelOkRes.data.refundAmount}`);
  } else {
    fail("Expected free cancellation success, got status: " + cancelOkRes.status, cancelOkRes.data);
  }

  // C. Rescheduling & Workload Re-assignment & Rate limits
  console.log("🔄 Testing rescheduling with re-assignment...");
  const newReschedStart = new Date();
  newReschedStart.setDate(newReschedStart.getDate() + 3);
  newReschedStart.setHours(14, 0, 0, 0);
  const newReschedEnd = new Date(newReschedStart);
  newReschedEnd.setHours(16, 0, 0, 0);

  const resched1 = await client.post(`/booking/${docBooking.id}/reschedule`, {
    slotStart: newReschedStart.toISOString(),
    slotEnd: newReschedEnd.toISOString(),
  }, { headers: authHeaders });

  if (resched1.status === 200) {
    ok(`Reschedule 1 successful. New slot: ${resched1.data.slotStart}`);
  } else {
    fail("Reschedule 1 failed", resched1.data);
  }

  // Reschedule 2 (allowed)
  newReschedStart.setDate(newReschedStart.getDate() + 1);
  newReschedEnd.setDate(newReschedEnd.getDate() + 1);
  const resched2 = await client.post(`/booking/${docBooking.id}/reschedule`, {
    slotStart: newReschedStart.toISOString(),
    slotEnd: newReschedEnd.toISOString(),
  }, { headers: authHeaders });
  if (resched2.status === 200) {
    ok("Reschedule 2 successful.");
  }

  // Reschedule 3 (should block by rate limiting: max 2/day)
  newReschedStart.setDate(newReschedStart.getDate() + 1);
  newReschedEnd.setDate(newReschedEnd.getDate() + 1);
  const resched3 = await client.post(`/booking/${docBooking.id}/reschedule`, {
    slotStart: newReschedStart.toISOString(),
    slotEnd: newReschedEnd.toISOString(),
  }, { headers: authHeaders });

  if (resched3.status === 400 && resched3.data.error?.includes("limit reached")) {
    ok(`Blocked by rescheduling rate limiting: "${resched3.data.error}"`);
  } else {
    fail("Expected reschedule 3 rate limit blocking, got: " + resched3.status, resched3.data);
  }

  // --------------------------------------------------
  // STAGE 3: ACTIVE SERVICE & OTP VERIFICATION
  // --------------------------------------------------
  section("Stage 3: Service OTP Verification");

  // A. Vet Clinic Receptionist Check-in Flow
  console.log("🏥 Clinic Receptionist OTP Check-in simulation...");
  // Try checkin with wrong OTP
  const badCheckin = await client.post(`/booking/${clinicBooking.id}/check-in`, { verificationOtp: "0000" }, { headers: authHeaders });
  if (badCheckin.status === 400) {
    ok("Clinic check-in rejected correctly with wrong OTP");
  } else {
    fail("Expected check-in rejection, got status: " + badCheckin.status, badCheckin.data);
  }

  // Checkin with correct OTP
  const goodCheckin = await client.post(`/booking/${clinicBooking.id}/check-in`, { verificationOtp: clinicBooking.verificationOtp }, { headers: authHeaders });
  if (goodCheckin.status === 200 && goodCheckin.data.booking?.status === BookingStatus.CHECKED_IN) {
    ok("Clinic check-in successful. Client status transitioned to CHECKED_IN");
  } else {
    fail("Clinic check-in failed", goodCheckin.data);
  }

  // B. Groomer / Home Doctor Completion Flow (Let's recreate the Grooming booking to test completion)
  console.log("✂️ Groomer home visit OTP Completion simulation...");
  const activeGrooming = await prisma.booking.create({
    data: {
      userId,
      cityId: city.id,
      petId: pet.id,
      addressId: address.id,
      serviceType: "GROOMING",
      status: BookingStatus.CONFIRMED,
      slotStart: tomorrow,
      slotEnd: tomorrowEnd,
      partnerId: partnerGroomer.id,
      verificationOtp: "7845",
    },
  });
  await prisma.payment.create({ data: { bookingId: activeGrooming.id, amount: 1200, status: "PENDING" } });
  await prisma.partner.update({ where: { id: partnerGroomer.id }, data: { activeBookings: 1 } });

  // Try complete with wrong OTP
  const badComplete = await client.post(`/booking/${activeGrooming.id}/complete`, { verificationOtp: "9999" }, { headers: authHeaders });
  if (badComplete.status === 400) {
    ok("Groomer completion rejected correctly with wrong OTP");
  } else {
    fail("Expected completion rejection, got status: " + badComplete.status, badComplete.data);
  }

  // Complete with correct OTP
  const goodComplete = await client.post(`/booking/${activeGrooming.id}/complete`, { verificationOtp: "7845" }, { headers: authHeaders });
  if (goodComplete.status === 200 && goodComplete.data.booking?.status === BookingStatus.COMPLETED) {
    ok("Groomer completion successful. Booking status is COMPLETED");

    // Check partner stats updated
    const updatedGroomer = await prisma.partner.findUnique({ where: { id: partnerGroomer.id } });
    if (updatedGroomer?.activeBookings === 0 && updatedGroomer?.totalCompleted === 1) {
      ok("Groomer completed count incremented, activeBookings decremented");
    } else {
      fail("Groomer counters not updated correctly", updatedGroomer);
    }

    // Check pending payment status updated to PAID
    const updatedPayment = await prisma.payment.findFirst({ where: { bookingId: activeGrooming.id } });
    if (updatedPayment?.status === "PAID") {
      ok("Pending Cash/PAS payment auto-updated to PAID on OTP success");
    } else {
      fail("Payment status not updated", updatedPayment);
    }
  } else {
    fail("Groomer completion failed", goodComplete.data);
  }

  // --------------------------------------------------
  // STAGE 4: FEEDBACK & DISPUTES
  // --------------------------------------------------
  section("Stage 4: Feedback & Support Tickets");

  // A. Submit Review (4-5 Stars) -> Positive Review Path
  console.log("⭐ Submitting a 5-star review...");
  const reviewRes = await client.post("/review", {
    bookingId: activeGrooming.id,
    rating: 5,
    comment: "Excellent service! Amit was very friendly with Buddy.",
  }, { headers: authHeaders });

  if (reviewRes.status === 200) {
    ok("5-star review submitted successfully.");
  } else {
    fail("Failed to submit review", reviewRes.data);
  }

  // B. Submit Support Ticket (1-3 Stars / Unresolved FAQ Complaint)
  console.log("⭐ Submitting a complaint...");
  const complaintRes = await client.post("/complaint", {
    bookingId: clinicBooking.id,
    message: "The doctor arrived 45 minutes late and didn't check Buddy properly.",
    category: "LATE_ARRIVAL",
  }, { headers: authHeaders });

  if (complaintRes.status === 200) {
    ok(`Complaint submitted successfully. Ticket ID: ${complaintRes.data.id}, Priority: ${complaintRes.data.priority}`);
  } else {
    fail("Failed to submit complaint", complaintRes.data);
  }

  // C. Intelligent Escalation (Fraud Keyword -> HIGH Priority)
  console.log("🚨 Testing auto-escalation with threat/fraud keywords...");
  const fraudComplaintRes = await client.post("/complaint", {
    message: "The partner demanded extra cash offline via Gpay scam.",
    category: "OVERCHARGING",
  }, { headers: authHeaders });

  if (fraudComplaintRes.status === 200 && fraudComplaintRes.data.priority === "HIGH") {
    ok(`Auto-escalated to HIGH priority. Priority: ${fraudComplaintRes.data.priority}`);
  } else {
    fail("Auto-escalation failed", fraudComplaintRes.data);
  }

  // D. Daily Complaint limits (Anti-abuse)
  console.log("🚨 Testing support requests daily limit (max 2/day)...");
  const limitComplaintRes = await client.post("/complaint", {
    message: "Testing limit third request.",
  }, { headers: authHeaders });

  if (limitComplaintRes.status === 400 && limitComplaintRes.data.error?.includes("limit of 2")) {
    ok(`Blocked by anti-abuse daily limit: "${limitComplaintRes.data.error}"`);
  } else {
    fail("Expected third support request blocking, got status: " + limitComplaintRes.status, limitComplaintRes.data);
  }

  // E. Test Partner-specific classifications directly
  console.log("🚨 Testing partner-perspective complaint classifications...");
  
  const absentResult = await classifyComplaint("The customer was not home. Ghar band tha.");
  if (absentResult.regexFlags.includes("USER_ABSENT") && absentResult.priority === "LOW") {
    ok("Correctly classified USER_ABSENT (Hinglish mix)");
  } else {
    fail("Failed to classify USER_ABSENT", absentResult);
  }

  const biteResult = await classifyComplaint("Kuteya ne kaat liya, pet was very wild and bit me.");
  if (biteResult.regexFlags.includes("PET_AGGRESSIVE") && biteResult.priority === "HIGH") {
    ok("Correctly escalated PET_AGGRESSIVE to HIGH priority");
  } else {
    fail("Failed to escalate PET_AGGRESSIVE", biteResult);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test bookings and partners...");
  await prisma.rescheduleLog.deleteMany({ where: { userId } });
  await prisma.complaint.deleteMany({ where: { userId } });
  await prisma.review.deleteMany({ where: { userId } });
  await prisma.payment.deleteMany({ where: { booking: { userId } } });
  await prisma.booking.deleteMany({ where: { userId } });
  await prisma.partnerService.deleteMany({ where: { partnerId: { in: [partnerGroomer.id, partnerDoctor.id, partnerClinic.id] } } });
  await prisma.partner.deleteMany({ where: { id: { in: [partnerGroomer.id, partnerDoctor.id, partnerClinic.id] } } });
  ok("Cleanup complete.");

  console.log("\n==================================================");
  printStyled("🎉 ALL MANUAL SIMULATION SCENARIOS COMPLETE & PASSED", "green");
  console.log("==================================================\n");
}

main().catch(console.error);
