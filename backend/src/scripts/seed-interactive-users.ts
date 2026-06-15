import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

const PASSWORD = "CanovetPass123!";
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

async function main() {
  console.log("🚀 Starting database cleanup and seeding interactive users...");

  try {
    // ─── Clean Existing Data ───
    console.log("[SEED] Cleaning up existing tables...");
    await prisma.userSession.deleteMany();
    await prisma.rescheduleLog.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.clinicAddress.deleteMany();
    await prisma.partnerService.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.address.deleteMany();
    await prisma.pet.deleteMany();
    await prisma.oTP.deleteMany();
    await prisma.promoUsage.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.waitlist.deleteMany();
    await prisma.user.deleteMany();
    await prisma.city.deleteMany();
    console.log("[SEED] Clean up completed.");

    // 1. City
    const city = await prisma.city.create({
      data: {
        name: "Ahmedabad",
        state: "Gujarat",
        isActive: true,
      },
    });
    console.log(`[SEED] Created City: ${city.name}`);

    // 2. Seed Partners in Areas
    const areas = [
      { name: "Shahpur", lat: 23.0362, lng: 72.5811 },
      { name: "Dariapur", lat: 23.0333, lng: 72.5954 },
      { name: "Jamalpur", lat: 23.0129, lng: 72.5848 },
      { name: "Khadia", lat: 23.0214, lng: 72.5891 },
      { name: "Asarwa", lat: 23.0469, lng: 72.6089 },
    ];

    const seededPartnersMap: Record<string, string> = {};
    let phoneCounter = 9800000001;

    for (const area of areas) {
      // Create Groomer Partner
      const p1 = await prisma.partner.create({
        data: {
          name: `${area.name} Groomer Service`,
          phone: String(phoneCounter++),
          cityId: city.id,
          latitude: area.lat,
          longitude: area.lng,
          address: `Van 1, ${area.name}, Ahmedabad`,
          isOnline: true,
          isVerified: true,
          rating: 4.8,
          services: { create: [{ serviceType: "GROOMING" }] },
        },
      });
      seededPartnersMap[`${area.name}_groomer`] = p1.id;

      // Create Vet Partner
      const p2 = await prisma.partner.create({
        data: {
          name: `Dr. ${area.name} (On-Call)`,
          phone: String(phoneCounter++),
          cityId: city.id,
          latitude: area.lat + 0.001,
          longitude: area.lng - 0.001,
          address: `Consulting visits, ${area.name}, Ahmedabad`,
          isOnline: true,
          isVerified: true,
          rating: 4.9,
          services: { create: [{ serviceType: "VET_ON_CALL" }] },
        },
      });
      seededPartnersMap[`${area.name}_vet`] = p2.id;

      // Create Clinic Partner
      const p3 = await prisma.partner.create({
        data: {
          name: `${area.name} Partner Clinic`,
          phone: String(phoneCounter++),
          cityId: city.id,
          latitude: area.lat - 0.001,
          longitude: area.lng + 0.001,
          address: `Canovet Clinic, Shop 4-5, ${area.name} Plaza, ${area.name}, Ahmedabad`,
          isOnline: true,
          isVerified: true,
          rating: 4.7,
          services: { create: [{ serviceType: "VET_CLINIC" }] },
        },
      });
      seededPartnersMap[`${area.name}_clinic`] = p3.id;

      // Create clinic address
      await prisma.clinicAddress.create({
        data: {
          partnerId: p3.id,
          name: `${area.name} Partner Clinic`,
          text: `Canovet Clinic, Shop 4-5, ${area.name} Plaza, ${area.name}, Ahmedabad`,
          latitude: area.lat - 0.001,
          longitude: area.lng + 0.001,
          area: area.name,
          city: "Ahmedabad",
          state: "Gujarat",
        },
      });
    }
    console.log(`[SEED] Seeded 15 partners successfully.`);

    // 3. Seed 12 Users
    const usersData = [
      { email: "user1@example.com", name: "Aarav Sharma" },
      { email: "user2@example.com", name: "Vihaan Patel" },
      { email: "user3@example.com", name: "Reyansh Mehta" },
      { email: "user4@example.com", name: "Sai Joshi" },
      { email: "user5@example.com", name: "Ananya Iyer" },
      { email: "user6@example.com", name: "Diya Nair" },
      { email: "user7@example.com", name: "Kiara Sen" },
      { email: "user8@example.com", name: "Aditya Roy" },
      { email: "user9@example.com", name: "Arjun Verma" },
      { email: "user10@example.com", name: "Pooja Hegde" },
      { email: "user11@example.com", name: "Rohan Kapoor" },
      { email: "user12@example.com", name: "Sneha Reddy" },
    ];

    const users: any[] = [];
    for (const u of usersData) {
      const createdUser = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: PASSWORD_HASH,
        },
      });
      users.push(createdUser);
    }
    console.log(`[SEED] Created 12 Users with email/password.`);

    // 4. Seed Pets and Addresses
    const petNames = ["Rusty", "Mimi", "Rocky", "Sheru", "Whiskers", "Bella", "Lucy", "Coco", "Bruno", "Leo", "Chloe", "Shadow"];
    const petBreeds = ["Golden Retriever", "Persian Cat", "German Shepherd", "Labrador", "Siamese Cat", "Beagle", "Ragdoll Cat", "Shih Tzu", "Pug", "Boxer", "German Shepherd", "Indie"];
    const addressesText = [
      "Flat 402, Shahpur Apartments, Shahpur",
      "Office B, Dariapur Commercial Center, Dariapur",
      "Unit 501, Khadia Plaza, Khadia",
      "Block B, Asarwa Society, Asarwa",
      "House 12, Jamalpur Road, Jamalpur",
    ];

    const pets: any[] = [];
    const addresses: any[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Seed 1-2 pets per user
      const p1 = await prisma.pet.create({
        data: {
          userId: user.id,
          name: petNames[i],
          type: i % 3 === 0 ? "cat" : "dog",
          breed: petBreeds[i],
          age: 1 + (i % 6),
          weight: 5 + (i * 2),
        },
      });
      pets.push(p1);

      // Seed 1 address per user
      const areaName = areas[i % areas.length].name;
      const addr = await prisma.address.create({
        data: {
          userId: user.id,
          text: `Flat ${100 + i}, ${areaName} Residency, ${areaName}`,
          house: `Flat ${100 + i}`,
          area: areaName,
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380001",
          latitude: areas[i % areas.length].lat,
          longitude: areas[i % areas.length].lng,
          label: i % 2 === 0 ? "Home" : "Office",
        },
      });
      addresses.push(addr);
    }
    console.log(`[SEED] Seeded pets and addresses.`);

    // 5. Seed Booking History (Confirmed, Completed, Rescheduled, Cancelled)
    // We want to make sure the users have various bookings
    console.log("[SEED] Creating booking records...");

    const statuses = [
      "COMPLETED",
      "CONFIRMED",
      "CANCELLED",
      "SEARCHING_PARTNER",
      "IN_PROGRESS",
    ];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const pet = pets[i];
      const address = addresses[i];
      const areaGroomerId = seededPartnersMap[`${areas[i % areas.length].name}_groomer`];
      const areaVetId = seededPartnersMap[`${areas[i % areas.length].name}_vet`];

      // Booking 1: Completed grooming service
      const b1 = await prisma.booking.create({
        data: {
          userId: user.id,
          cityId: city.id,
          partnerId: areaGroomerId,
          serviceType: "GROOMING",
          petId: pet.id,
          addressId: address.id,
          status: "COMPLETED",
          slotStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          slotEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b1.id,
          amount: 999,
          status: "SUCCESS",
        },
      });

      await prisma.review.create({
        data: {
          userId: user.id,
          partnerId: areaGroomerId,
          bookingId: b1.id,
          rating: 4 + (i % 2),
          comment: "Really great service, my pet felt very comfortable!",
        },
      });

      // Booking 2: Cancelled vet on call service
      const b2 = await prisma.booking.create({
        data: {
          userId: user.id,
          cityId: city.id,
          partnerId: areaVetId,
          serviceType: "VET_ON_CALL",
          petId: pet.id,
          addressId: address.id,
          status: "CANCELLED",
          slotStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          slotEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b2.id,
          amount: 599,
          status: "PENDING",
        },
      });

      await prisma.complaint.create({
        data: {
          userId: user.id,
          bookingId: b2.id,
          message: "Cancelled booking but payment refund is pending.",
          status: "OPEN",
          category: "REFUND",
          priority: "HIGH",
          phone: "9900001111",
          whatsapp: "9900001111",
        },
      });

      // Booking 3: Confirmed / Upcoming booking
      const b3 = await prisma.booking.create({
        data: {
          userId: user.id,
          cityId: city.id,
          partnerId: areaGroomerId,
          serviceType: "GROOMING",
          petId: pet.id,
          addressId: address.id,
          status: "CONFIRMED",
          slotStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
          slotEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b3.id,
          amount: 1199,
          status: "SUCCESS",
        },
      });

      // Booking 4: Rescheduled booking (create RescheduleLog)
      const b4 = await prisma.booking.create({
        data: {
          userId: user.id,
          cityId: city.id,
          partnerId: areaVetId,
          serviceType: "VET_ON_CALL",
          petId: pet.id,
          addressId: address.id,
          status: "CONFIRMED",
          slotStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
          slotEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        },
      });

      await prisma.rescheduleLog.create({
        data: {
          userId: user.id,
          bookingId: b4.id,
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b4.id,
          amount: 499,
          status: "SUCCESS",
        },
      });

      // Booking 5: Completed clinic booking
      const clinicPartnerId = seededPartnersMap[`${areas[i % areas.length].name}_clinic`];
      const b5 = await prisma.booking.create({
        data: {
          userId: user.id,
          cityId: city.id,
          clinicId: clinicPartnerId,
          serviceType: "VET_CLINIC",
          petId: pet.id,
          status: "COMPLETED",
          slotStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          slotEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b5.id,
          amount: 400,
          status: "SUCCESS",
        },
      });
    }

    console.log("[SEED] Booking history seeded successfully for all 12 users!");

    console.log("\n==================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log("Here are the test user accounts you can use to test:");
    for (let i = 0; i < usersData.length; i++) {
      console.log(`Email: ${usersData[i].email} | Password: ${PASSWORD} | Name: ${usersData[i].name}`);
    }
    console.log("==================================================\n");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
