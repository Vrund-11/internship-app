import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { ServiceType } from "@canovet/shared";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

const PASSWORD = "CanovetPass123!";
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

async function seedAll() {
  console.log("[SEED] Starting database seeding...");

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

    // ─── 1. City ───
    const city = await prisma.city.create({
      data: {
        name: "Ahmedabad",
        state: "Gujarat",
        isActive: true,
      },
    });
    console.log(`[SEED] Created City: ${city.name}`);

    // ─── 2. Areas Definition ───
    const areas = [
      // Full Service Areas (9 areas)
      { name: "Shahpur", lat: 23.0362, lng: 72.5811, type: "full_3" },
      { name: "Dariapur", lat: 23.0333, lng: 72.5954, type: "full_3" },
      { name: "Jamalpur", lat: 23.0129, lng: 72.5848, type: "full_3" },
      { name: "Khadia", lat: 23.0214, lng: 72.5891, type: "full_1" },
      { name: "Asarwa", lat: 23.0469, lng: 72.6089, type: "full_1" },
      { name: "Shahibaug", lat: 23.0582, lng: 72.5932, type: "full_1" },
      { name: "Behrampura", lat: 23.0092, lng: 72.5807, type: "full_1" },
      { name: "Raipur (local area)", lat: 23.0396, lng: 72.566, type: "full_1" },
      { name: "Kankaria", lat: 23.0067, lng: 72.5962, type: "full_1" },

      // Partial Service Areas (10 areas)
      { name: "Bapunagar", lat: 23.0384, lng: 72.6305, type: "partial_grooming" },
      { name: "Thakkar Bapanagar", lat: 23.0406, lng: 72.643, type: "partial_grooming" },
      { name: "Saraspur", lat: 23.0273, lng: 72.6078, type: "partial_grooming" },
      { name: "Sardarnagar", lat: 23.083, lng: 72.6204, type: "partial_vet_on_call" },
      { name: "Kubernagar", lat: 23.0682, lng: 72.6425, type: "partial_vet_on_call" },
      { name: "Saijpur Bogha", lat: 23.0632, lng: 72.6317, type: "partial_vet_on_call" },
      { name: "Kalupur", lat: 23.0292, lng: 72.6003, type: "partial_clinic" },
      { name: "Manek Chowk", lat: 23.0236, lng: 72.5886, type: "partial_clinic" },
      { name: "Teen Darwaja", lat: 23.0242, lng: 72.5846, type: "partial_clinic" },
      { name: "Bhadra Fort", lat: 23.0236, lng: 72.5811, type: "partial_clinic" },

      // Empty Areas (10 areas)
      { name: "Khokhra", lat: 23.0019, lng: 72.6189, type: "empty" },
      { name: "Lambha", lat: 22.9382, lng: 72.5761, type: "empty" },
      { name: "Isanpur", lat: 22.9807, lng: 72.6012, type: "empty" },
      { name: "Vatva", lat: 22.9664, lng: 72.6159, type: "empty" },
      { name: "Gomtipur", lat: 23.019, lng: 72.6217, type: "empty" },
      { name: "Odhav", lat: 23.0257, lng: 72.672, type: "empty" },
      { name: "Vastral", lat: 22.9968, lng: 72.6713, type: "empty" },
      { name: "Amraiwadi", lat: 23.0057, lng: 72.627, type: "empty" },
      { name: "Nikol", lat: 23.05, lng: 72.67, type: "empty" },
      { name: "Ramol", lat: 22.9731, lng: 72.6561, type: "empty" },
    ];

    // ─── 3. Partners & Services Seeding ───
    let phoneCounter = 9000000100;
    const allSeedPartners: any[] = [];

    for (const area of areas) {
      if (area.type === "empty") {
        console.log(`[SEED] Area ${area.name} left empty (30-40% empty rule)`);
        continue;
      }

      let groomerCount = 0;
      let vetOnCallCount = 0;
      let clinicCount = 0;

      if (area.type === "full_3") {
        groomerCount = 3;
        vetOnCallCount = 3;
        clinicCount = 3;
      } else if (area.type === "full_1") {
        groomerCount = 1;
        vetOnCallCount = 1;
        clinicCount = 1;
      } else if (area.type === "partial_grooming") {
        groomerCount = 1;
      } else if (area.type === "partial_vet_on_call") {
        vetOnCallCount = 1;
      } else if (area.type === "partial_clinic") {
        clinicCount = 1;
      }

      // Create Groomer Partners
      for (let i = 1; i <= groomerCount; i++) {
        allSeedPartners.push({
          name: `${area.name} Groomer ${i}`,
          phone: String(phoneCounter++),
          lat: area.lat + (Math.random() - 0.5) * 0.002,
          lng: area.lng + (Math.random() - 0.5) * 0.002,
          address: `Mobile Van ${i}, ${area.name}, Ahmedabad`,
          services: [ServiceType.GROOMING],
        });
      }

      // Create Vet On Call Partners
      for (let i = 1; i <= vetOnCallCount; i++) {
        allSeedPartners.push({
          name: `Dr. ${area.name} (OnCall ${i})`,
          phone: String(phoneCounter++),
          lat: area.lat + (Math.random() - 0.5) * 0.002,
          lng: area.lng + (Math.random() - 0.5) * 0.002,
          address: `Home Visits ${i}, ${area.name}, Ahmedabad`,
          services: [ServiceType.VET_ON_CALL],
        });
      }

      // Create Clinic Partners
      for (let i = 1; i <= clinicCount; i++) {
        allSeedPartners.push({
          name: `Canovet Clinic ${area.name} ${i}`,
          phone: String(phoneCounter++),
          lat: area.lat + (Math.random() - 0.5) * 0.002,
          lng: area.lng + (Math.random() - 0.5) * 0.002,
          address: `Canovet Clinic Complex, Block ${i}, ${area.name}, Ahmedabad`,
          services: [ServiceType.VET_CLINIC],
        });
      }
    }

    console.log(`[SEED] Seeding ${allSeedPartners.length} partners...`);
    const seededPartnersMap: Record<string, string> = {};

    for (const p of allSeedPartners) {
      const partner = await prisma.partner.create({
        data: {
          name: p.name,
          phone: p.phone,
          cityId: city.id,
          latitude: p.lat,
          longitude: p.lng,
          address: p.address,
          isOnline: true,
          isVerified: true,
          rating: 4.5 + Math.random() * 0.5,
          totalCompleted: Math.floor(Math.random() * 100) + 10,
          services: {
            create: p.services.map((s: string) => ({ serviceType: s })),
          },
        },
      });

      seededPartnersMap[p.name] = partner.id;

      if (p.services.includes(ServiceType.VET_CLINIC)) {
        await prisma.clinicAddress.create({
          data: {
            partnerId: partner.id,
            name: p.name,
            text: p.address,
            latitude: p.lat,
            longitude: p.lng,
            area: p.address,
            city: "Ahmedabad",
            state: "Gujarat",
          },
        });
      }
    }
    console.log("[SEED] Partners seeded successfully.");

    // ─── 4. User, Pets & Addresses Seeding ───
    console.log("[SEED] Seeding default test users, pets, and addresses...");

    // User 1: Krishna Patel (matching login default)
    const userKrishna = await prisma.user.create({
      data: {
        email: "vrundupadhyay1103@gmail.com",
        name: "Krishna Patel",
        passwordHash: PASSWORD_HASH,
      },
    });

    // User 2: Rohan Shah
    const userRohan = await prisma.user.create({
      data: {
        email: "rohan@example.com",
        name: "Rohan Shah",
        passwordHash: PASSWORD_HASH,
      },
    });

    // User 3: Dev Patel
    const userDev = await prisma.user.create({
      data: {
        email: "dev@example.com",
        name: "Dev Patel",
        passwordHash: PASSWORD_HASH,
      },
    });

    // User 4: Aarav Mehta
    const userAarav = await prisma.user.create({
      data: {
        email: "aarav@example.com",
        name: "Aarav Mehta",
        passwordHash: PASSWORD_HASH,
      },
    });

    // User 5: Priya Sharma
    const userPriya = await prisma.user.create({
      data: {
        email: "priya@example.com",
        name: "Priya Sharma",
        passwordHash: PASSWORD_HASH,
      },
    });

    // User 6: Test User 1 (user1@example.com / CanovetPass123!)
    const user1PasswordHash = bcrypt.hashSync("CanovetPass123!", 10);
    const user1 = await prisma.user.create({
      data: {
        email: "user1@example.com",
        name: "Test User 1",
        passwordHash: user1PasswordHash,
      },
    });

    console.log("[SEED] Created 6 users.");

    // Seed Pets for Users
    const pet1 = await prisma.pet.create({
      data: { userId: userKrishna.id, name: "Rusty", type: "dog", breed: "Golden Retriever", age: 3, weight: 28.5 },
    });
    const pet2 = await prisma.pet.create({
      data: { userId: userKrishna.id, name: "Mimi", type: "cat", breed: "Persian", age: 2, weight: 4.2 },
    });

    const pet3 = await prisma.pet.create({
      data: { userId: userRohan.id, name: "Rocky", type: "dog", breed: "German Shepherd", age: 4, weight: 32.0 },
    });

    const pet4 = await prisma.pet.create({
      data: { userId: userDev.id, name: "Sheru", type: "dog", breed: "Labrador", age: 5, weight: 30.0 },
    });
    const pet5 = await prisma.pet.create({
      data: { userId: userDev.id, name: "Whiskers", type: "cat", breed: "Siamese", age: 1, weight: 3.5 },
    });

    const pet6 = await prisma.pet.create({
      data: { userId: userAarav.id, name: "Bella", type: "dog", breed: "Beagle", age: 2, weight: 12.0 },
    });

    const pet7 = await prisma.pet.create({
      data: { userId: userPriya.id, name: "Lucy", type: "cat", breed: "Ragdoll", age: 3, weight: 5.0 },
    });
    const pet8 = await prisma.pet.create({
      data: { userId: userPriya.id, name: "Coco", type: "dog", breed: "Shih Tzu", age: 1, weight: 6.0 },
    });

    const pet9 = await prisma.pet.create({
      data: { userId: user1.id, name: "Buddy", type: "dog", breed: "Beagle", age: 2, weight: 11.5 },
    });
    const pet10 = await prisma.pet.create({
      data: { userId: user1.id, name: "Simba", type: "cat", breed: "Maine Coon", age: 3, weight: 7.2 },
    });

    console.log("[SEED] Created 10 pets.");

    // Seed Multiple Addresses for Users (Home, Office, Other)
    // Krishna Patel
    const addrKrishnaHome = await prisma.address.create({
      data: { userId: userKrishna.id, text: "Flat 402, Shahpur Apartments, Shahpur", house: "Flat 402", area: "Shahpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0362, longitude: 72.5811, label: "Home" },
    });
    const addrKrishnaOffice = await prisma.address.create({
      data: { userId: userKrishna.id, text: "Office B, Dariapur Commercial Center, Dariapur", house: "Office B", area: "Dariapur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0333, longitude: 72.5954, label: "Office" },
    });
    const addrKrishnaOther = await prisma.address.create({
      data: { userId: userKrishna.id, text: "G-12, Kankaria Lakefront, Kankaria", house: "G-12", area: "Kankaria", city: "Ahmedabad", state: "Gujarat", pincode: "380002", latitude: 23.0067, longitude: 72.5962, label: "Other" },
    });

    // Rohan Shah
    const addrRohanHome = await prisma.address.create({
      data: { userId: userRohan.id, text: "House 12, Jamalpur Road, Jamalpur", house: "House 12", area: "Jamalpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0129, longitude: 72.5848, label: "Home" },
    });
    const addrRohanOffice = await prisma.address.create({
      data: { userId: userRohan.id, text: "Unit 501, Khadia Plaza, Khadia", house: "Unit 501", area: "Khadia", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0214, longitude: 72.5891, label: "Office" },
    });
    const addrRohanOther = await prisma.address.create({
      data: { userId: userRohan.id, text: "Block B, Asarwa Society, Asarwa", house: "Block B", area: "Asarwa", city: "Ahmedabad", state: "Gujarat", pincode: "380016", latitude: 23.0469, longitude: 72.6089, label: "Other" },
    });

    // Dev Patel
    const addrDevHome = await prisma.address.create({
      data: { userId: userDev.id, text: "A-404, Shahibaug Heights, Shahibaug", house: "A-404", area: "Shahibaug", city: "Ahmedabad", state: "Gujarat", pincode: "380004", latitude: 23.0582, longitude: 72.5932, label: "Home" },
    });
    const addrDevOffice = await prisma.address.create({
      data: { userId: userDev.id, text: "Tech Park, Behrampura Road, Behrampura", house: "Tech Park", area: "Behrampura", city: "Ahmedabad", state: "Gujarat", pincode: "380022", latitude: 23.0092, longitude: 72.5807, label: "Office" },
    });

    // Aarav Mehta
    const addrAaravHome = await prisma.address.create({
      data: { userId: userAarav.id, text: "12-B, Dariapur Flats, Dariapur", house: "12-B", area: "Dariapur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0333, longitude: 72.5954, label: "Home" },
    });
    const addrAaravOffice = await prisma.address.create({
      data: { userId: userAarav.id, text: "Mehta Traders, Shahpur Circle, Shahpur", house: "Mehta Traders", area: "Shahpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0362, longitude: 72.5811, label: "Office" },
    });

    // Priya Sharma
    const addrPriyaHome = await prisma.address.create({
      data: { userId: userPriya.id, text: "Flat 303, Jamalpur Enclave, Jamalpur", house: "Flat 303", area: "Jamalpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0129, longitude: 72.5848, label: "Home" },
    });
    const addrPriyaOffice = await prisma.address.create({
      data: { userId: userPriya.id, text: "Priya Boutique, Khadia Gate, Khadia", house: "Priya Boutique", area: "Khadia", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0214, longitude: 72.5891, label: "Office" },
    });
    const addrPriyaOther = await prisma.address.create({
      data: { userId: userPriya.id, text: "Saraswati Niwas, Asarwa, Asarwa", house: "Saraswati Niwas", area: "Asarwa", city: "Ahmedabad", state: "Gujarat", pincode: "380016", latitude: 23.0469, longitude: 72.6089, label: "Other" },
    });

    // Test User 1 (user1@example.com)
    const addrUser1Home = await prisma.address.create({
      data: { userId: user1.id, text: "B-501, Shahpur Residency, Shahpur", house: "B-501", area: "Shahpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0362, longitude: 72.5811, label: "Home" },
    });
    const addrUser1Office = await prisma.address.create({
      data: { userId: user1.id, text: "Unit 102, Khadia Business Hub, Khadia", house: "Unit 102", area: "Khadia", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0214, longitude: 72.5891, label: "Office" },
    });

    console.log("[SEED] Created 14 addresses (Home, Office, Other distributed).");

    // ─── 5. Promo Code Seeding (Seed at least 4 PromoCodes & multiple usages) ───
    console.log("[SEED] Seeding Promo Codes & Usages...");
    const promo1 = await prisma.promoCode.create({ data: { code: "PAW50", discountPercent: 50, maxUsesPerUser: 1, isActive: true } });
    const promo2 = await prisma.promoCode.create({ data: { code: "WELCOME10", discountPercent: 10, maxUsesPerUser: 3, isActive: true } });
    const promo3 = await prisma.promoCode.create({ data: { code: "CANOCARE20", discountPercent: 20, maxUsesPerUser: 2, isActive: true } });
    const promo4 = await prisma.promoCode.create({ data: { code: "FREESHIP", discountPercent: 15, maxUsesPerUser: 5, isActive: true } });

    // Seed multiple usages
    await prisma.promoUsage.create({ data: { userId: userRohan.id, promoCodeId: promo1.id } });
    await prisma.promoUsage.create({ data: { userId: userKrishna.id, promoCodeId: promo2.id } });
    await prisma.promoUsage.create({ data: { userId: userDev.id, promoCodeId: promo2.id } });
    await prisma.promoUsage.create({ data: { userId: userPriya.id, promoCodeId: promo3.id } });
    await prisma.promoUsage.create({ data: { userId: userAarav.id, promoCodeId: promo4.id } });

    console.log("[SEED] Seeded Promo Codes & Promo Usages.");

    // ─── 6. Waitlist Seeding (Seed 10 Waitlist records) ───
    console.log("[SEED] Seeding Waitlists (10 entries)...");
    const waitlistData = [
      { phone: "9876500001", serviceType: "pet-food", wantsFaster: true },
      { phone: "9876500002", serviceType: "pet-insurance", wantsFaster: false },
      { phone: "9876500003", serviceType: "vet-on-call", wantsFaster: true },
      { phone: "9876500004", serviceType: "grooming", wantsFaster: false },
      { phone: "9876500005", serviceType: "pet-pharmacy", wantsFaster: true },
      { phone: "9876500006", serviceType: "pet-food", wantsFaster: false },
      { phone: "9876500007", serviceType: "pet-insurance", wantsFaster: true },
      { phone: "9876500008", serviceType: "vet-clinic", wantsFaster: false },
      { phone: "9876500009", serviceType: "grooming", wantsFaster: true },
      { phone: "9876500010", serviceType: "pet-pharmacy", wantsFaster: false },
    ];
    for (const w of waitlistData) {
      await prisma.waitlist.create({ data: w });
    }
    console.log("[SEED] Seeded 10 Waitlist entries.");

    // ─── 7. Bookings, Payments, Reviews & Complaints Seeding (Seed 15-20 Bookings) ───
    console.log("[SEED] Seeding Bookings & related records...");

    // Find some seeded partners to attach to bookings
    const shahpurGroomerId = seededPartnersMap["Shahpur Groomer 1"];
    const dariapurVetId = seededPartnersMap["Dr. Dariapur (OnCall 1)"];
    const jamalpurClinicId = seededPartnersMap["Canovet Clinic Jamalpur 1"];
    const khadiaGroomerId = seededPartnersMap["Khadia Groomer 1"];
    const asarwaVetId = seededPartnersMap["Dr. Asarwa (OnCall 1)"];

    // We will define 15 distinct bookings to seed
    const bookingSeeds = [
      {
        userId: userKrishna.id,
        partnerId: shahpurGroomerId,
        serviceType: "GROOMING",
        petId: pet1.id,
        addressId: addrKrishnaHome.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        slotEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 899,
        reviewRating: 5,
        reviewComment: "Excellent haircut for Rusty! The groomer was very professional.",
      },
      {
        userId: userKrishna.id,
        partnerId: dariapurVetId,
        serviceType: "VET_ON_CALL",
        petId: pet2.id,
        addressId: addrKrishnaOffice.id,
        status: "CONFIRMED",
        slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        slotEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 199,
      },
      {
        userId: userRohan.id,
        clinicId: jamalpurClinicId,
        serviceType: "VET_CLINIC",
        petId: pet3.id,
        addressId: addrRohanHome.id,
        status: "CANCELLED",
        slotStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        slotEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 400,
        complaint: {
          message: "The clinic was closed when I arrived. Highly disappointed.",
          status: "OPEN",
          category: "CLINIC_CLOSED",
          priority: "HIGH",
          phone: "+919999988888",
          whatsapp: "+919999988888",
        },
      },
      {
        userId: userKrishna.id,
        clinicId: jamalpurClinicId,
        serviceType: "VET_CLINIC",
        petId: pet1.id,
        addressId: addrKrishnaHome.id,
        status: "IN_PROGRESS",
        slotStart: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        slotEnd: new Date(Date.now() + 30 * 60 * 1000),
        amount: 500,
        hasReschedule: true,
      },
      {
        userId: userDev.id,
        partnerId: khadiaGroomerId,
        serviceType: "GROOMING",
        petId: pet4.id,
        addressId: addrDevHome.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        slotEnd: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 999,
        reviewRating: 4,
        reviewComment: "Great job, but they arrived 20 minutes late.",
        complaint: {
          message: "The partner was delayed by 20 minutes.",
          status: "RESOLVED",
          category: "LATE",
          priority: "LOW",
          phone: "+919876543210",
          whatsapp: "+919876543210",
        },
      },
      {
        userId: userDev.id,
        partnerId: asarwaVetId,
        serviceType: "VET_ON_CALL",
        petId: pet5.id,
        addressId: addrDevOffice.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
        slotEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 599,
        reviewRating: 5,
        reviewComment: "Very nice consulting, Whiskers is doing well.",
      },
      {
        userId: userAarav.id,
        partnerId: shahpurGroomerId,
        serviceType: "GROOMING",
        petId: pet6.id,
        addressId: addrAaravHome.id,
        status: "AWAITING_PAYMENT",
        slotStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        slotEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 1199,
      },
      {
        userId: userPriya.id,
        partnerId: dariapurVetId,
        serviceType: "VET_ON_CALL",
        petId: pet7.id,
        addressId: addrPriyaHome.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        slotEnd: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 799,
        reviewRating: 2,
        reviewComment: "Rough pet handling. Lucy was scared.",
        complaint: {
          message: "Rough pet handling during consultation.",
          status: "OPEN",
          category: "PET_HANDLING",
          priority: "HIGH",
          phone: "+917654321098",
          whatsapp: "+917654321098",
        },
      },
      {
        userId: userPriya.id,
        partnerId: khadiaGroomerId,
        serviceType: "GROOMING",
        petId: pet8.id,
        addressId: addrPriyaOther.id,
        status: "CONFIRMED",
        slotStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
        slotEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 1999,
      },
      {
        userId: userRohan.id,
        partnerId: dariapurVetId,
        serviceType: "VET_ON_CALL",
        petId: pet3.id,
        addressId: addrRohanOffice.id,
        status: "SEARCHING_PARTNER",
        slotStart: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
        slotEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 399,
      },
      {
        userId: userDev.id,
        clinicId: jamalpurClinicId,
        serviceType: "VET_CLINIC",
        petId: pet4.id,
        addressId: addrDevHome.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        slotEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 1500,
        reviewRating: 4,
        reviewComment: "Quick service, clinic clean.",
      },
      {
        userId: userAarav.id,
        partnerId: asarwaVetId,
        serviceType: "VET_ON_CALL",
        petId: pet6.id,
        addressId: addrAaravOffice.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        slotEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 599,
        reviewRating: 1,
        reviewComment: "Doctor demanded extra cash for transport.",
        complaint: {
          message: "Doctor demanded extra transport fee in cash offline.",
          status: "OPEN",
          category: "OVERCHARGING",
          priority: "HIGH",
          phone: "+918765432109",
          whatsapp: "+918765432109",
        },
      },
      {
        userId: userKrishna.id,
        partnerId: shahpurGroomerId,
        serviceType: "GROOMING",
        petId: pet2.id,
        addressId: addrKrishnaOther.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        slotEnd: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 699,
        reviewRating: 3,
        reviewComment: "Groomer was rude, didn't talk properly.",
        complaint: {
          message: "Partner was rude during interaction.",
          status: "OPEN",
          category: "COMMUNICATION",
          priority: "LOW",
          phone: "+912562546246",
          whatsapp: "+912562546246",
        },
      },
      {
        userId: userKrishna.id,
        partnerId: asarwaVetId,
        serviceType: "VET_ON_CALL",
        petId: pet1.id,
        addressId: addrKrishnaHome.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        slotEnd: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        amount: 599,
        reviewRating: 5,
        reviewComment: "Highly recommended!",
      },
      {
        userId: userRohan.id,
        partnerId: khadiaGroomerId,
        serviceType: "GROOMING",
        petId: pet3.id,
        addressId: addrRohanOther.id,
        status: "COMPLETED",
        slotStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        slotEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        amount: 999,
        reviewRating: 4,
        reviewComment: "Nice haircut.",
      },
    ];

    let bookingIndex = 1;
    for (const b of bookingSeeds) {
      const createdBooking = await prisma.booking.create({
        data: {
          userId: b.userId,
          cityId: city.id,
          partnerId: b.partnerId,
          clinicId: b.clinicId,
          slotStart: b.slotStart,
          slotEnd: b.slotEnd,
          serviceType: b.serviceType,
          petId: b.petId,
          addressId: b.addressId,
          status: b.status,
        },
      });

      // Payment for Booking
      await prisma.payment.create({
        data: {
          bookingId: createdBooking.id,
          amount: b.amount,
          status: b.status === "COMPLETED" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS" ? "SUCCESS" : "PENDING",
          method: b.serviceType === "VET_CLINIC" ? "online" : (bookingIndex % 2 === 0 ? "offline" : "online"),
        },
      });

      // Review for Booking
      if (b.reviewRating !== undefined) {
        await prisma.review.create({
          data: {
            userId: b.userId,
            partnerId: b.partnerId || shahpurGroomerId,
            bookingId: createdBooking.id,
            rating: b.reviewRating,
            comment: b.reviewComment,
          },
        });
      }

      // Complaint for Booking
      if (b.complaint) {
        await prisma.complaint.create({
          data: {
            userId: b.userId,
            bookingId: createdBooking.id,
            message: b.complaint.message,
            status: b.complaint.status,
            category: b.complaint.category,
            priority: b.complaint.priority,
            phone: b.complaint.phone,
            whatsapp: b.complaint.whatsapp,
          },
        });
      }

      // Reschedule Log
      if (b.hasReschedule) {
        await prisma.rescheduleLog.create({
          data: {
            userId: b.userId,
            bookingId: createdBooking.id,
          },
        });
      }

      bookingIndex++;
    }

    console.log("[SEED] All tables seeded successfully! Database is ready with plenty of users and booking records.");
  } catch (error) {
    console.error("[SEED] Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAll();
