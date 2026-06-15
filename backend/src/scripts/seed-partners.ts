import { ServiceType } from "@canovet/shared";
import { prisma } from "../utils/prisma";

async function seedPartners() {
  try {
    let city = await prisma.city.findFirst({ where: { name: "Ahmedabad" } });
    if (!city) {
      city = await prisma.city.create({
        data: {
          name: "Ahmedabad",
          state: "Gujarat",
          isActive: true,
        },
      });
      console.log("[SEED] Created city Ahmedabad");
    }

    const partners = [
      // --- GROOMING ---
      {
        name: "Suresh (Groomer)",
        phone: "9876543211",
        latitude: 23.0300,
        longitude: 72.5800,
        address: "Mobile Grooming Van, Maninagar, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.5,
        totalCompleted: 320,
        services: [ServiceType.GROOMING]
      },
      {
        name: "Ramesh Grooming Van",
        phone: "9876543212",
        latitude: 23.0232,
        longitude: 72.5714,
        address: "CanoVet Mobile Grooming, CG Road, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.7,
        totalCompleted: 140,
        services: [ServiceType.GROOMING]
      },
      {
        name: "Priya's Pet Salon",
        phone: "9876543215",
        latitude: 23.0150,
        longitude: 72.5200,
        address: "Priya Pet Care, Vejalpur, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.6,
        totalCompleted: 85,
        services: [ServiceType.GROOMING]
      },
      {
        name: "Happy Tails Grooming",
        phone: "9876543216",
        latitude: 23.0450,
        longitude: 72.5100,
        address: "Happy Tails Spa, Gota, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.8,
        totalCompleted: 210,
        services: [ServiceType.GROOMING]
      },
      {
        name: "Whisker & Wag Spa",
        phone: "9876543217",
        latitude: 23.0550,
        longitude: 72.5400,
        address: "Whisker & Wag, Chandkheda, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.4,
        totalCompleted: 95,
        services: [ServiceType.GROOMING]
      },

      // --- VET ON CALL ---
      {
        name: "Dr. Anjali (Home Vet)",
        phone: "9876543218",
        latitude: 23.0350,
        longitude: 72.5500,
        address: "Dr. Anjali Clinic, Paldi, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.9,
        totalCompleted: 175,
        services: [ServiceType.VET_ON_CALL]
      },
      {
        name: "Dr. Kabir Mobile Vet",
        phone: "9876543219",
        latitude: 23.0400,
        longitude: 72.5300,
        address: "Dr. Kabir Home Visits, Naranpura, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.7,
        totalCompleted: 112,
        services: [ServiceType.VET_ON_CALL]
      },
      {
        name: "Dr. Shalini (Vet on Call)",
        phone: "9876543220",
        latitude: 23.0200,
        longitude: 72.5600,
        address: "Dr. Shalini Home Care, Ellisbridge, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.8,
        totalCompleted: 130,
        services: [ServiceType.VET_ON_CALL]
      },

      // --- VET CLINIC ---
      {
        name: "Dr. Aditi (Vet Clinic)",
        phone: "9876543213",
        latitude: 23.03096,
        longitude: 72.51857,
        address: "CanoVet Satellite, Satellite Road, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.9,
        totalCompleted: 210,
        services: [ServiceType.VET_CLINIC]
      },
      {
        name: "CanoVet Clinic - Satellite",
        phone: "9100000021",
        latitude: 23.03096,
        longitude: 72.51857,
        address: "CanoVet Clinic, Satellite Area, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.8,
        totalCompleted: 405,
        services: [ServiceType.VET_CLINIC]
      },
      {
        name: "CanoVet Clinic - Prahlad Nagar",
        phone: "9100000022",
        latitude: 23.01191,
        longitude: 72.50456,
        address: "CanoVet Clinic, Prahlad Nagar, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.7,
        totalCompleted: 350,
        services: [ServiceType.VET_CLINIC]
      },
      {
        name: "CanoVet Clinic - Bodakdev",
        phone: "9100000023",
        latitude: 23.0445,
        longitude: 72.5273,
        address: "CanoVet Clinic, Bodakdev Area, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.9,
        totalCompleted: 280,
        services: [ServiceType.VET_CLINIC]
      },
      {
        name: "CanoVet Clinic - Navrangpura",
        phone: "9100000024",
        latitude: 23.037,
        longitude: 72.566,
        address: "CanoVet Clinic, CG Road, Navrangpura, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.6,
        totalCompleted: 510,
        services: [ServiceType.VET_CLINIC]
      },

      // --- HYBRID (VET CLINIC & VET ON CALL) ---
      {
        name: "Dr. Ramesh (Vet)",
        phone: "9876543210",
        latitude: 23.0225,
        longitude: 72.5714,
        address: "CanoVet Navrangpura, CG Road, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.8,
        totalCompleted: 150,
        services: [ServiceType.VET_CLINIC, ServiceType.VET_ON_CALL]
      },
      {
        name: "Dr. Rohan (Vet)",
        phone: "9876543214",
        latitude: 23.01191,
        longitude: 72.50456,
        address: "CanoVet Prahlad Nagar, Anandnagar Road, Ahmedabad",
        isOnline: true,
        isVerified: true,
        rating: 4.7,
        totalCompleted: 180,
        services: [ServiceType.VET_CLINIC, ServiceType.VET_ON_CALL]
      }
    ];

    for (const p of partners) {
      const existing = await prisma.partner.findUnique({ where: { phone: p.phone } });
      if (!existing) {
        const newPartner = await prisma.partner.create({
          data: {
            name: p.name,
            phone: p.phone,
            cityId: city.id,
            latitude: p.latitude,
            longitude: p.longitude,
            address: p.address,
            isOnline: p.isOnline,
            isVerified: p.isVerified,
            rating: p.rating,
            totalCompleted: p.totalCompleted,
            services: {
              create: p.services.map((s: ServiceType) => ({ serviceType: s }))
            }
          }
        });
        console.log(`[SEED] Created partner: ${newPartner.name}`);

        // Create ClinicAddress for VET_CLINIC partners
        if (p.services.includes(ServiceType.VET_CLINIC)) {
          await prisma.clinicAddress.create({
            data: {
              partnerId: newPartner.id,
              name: p.name,
              text: p.address,
              latitude: p.latitude,
              longitude: p.longitude,
              area: p.address,
              city: "Ahmedabad",
              state: "Gujarat",
            },
          });
          console.log(`[SEED] Created clinic address for: ${newPartner.name}`);
        }
      } else {
        await prisma.partnerService.deleteMany({
          where: { partnerId: existing.id },
        });
        await prisma.partnerService.createMany({
          data: p.services.map((s: ServiceType) => ({
            partnerId: existing.id,
            serviceType: s,
          })),
        });
        // Update existing details
        await prisma.partner.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            cityId: city.id,
            isOnline: p.isOnline,
            isVerified: p.isVerified,
            rating: p.rating,
            totalCompleted: p.totalCompleted,
          }
        });
        console.log(`[SEED] Updated partner: ${existing.name}`);

        // Ensure ClinicAddress exists for VET_CLINIC partners
        if (p.services.includes(ServiceType.VET_CLINIC)) {
          const existingClinicAddr = await prisma.clinicAddress.findFirst({
            where: { partnerId: existing.id },
          });
          if (!existingClinicAddr) {
            await prisma.clinicAddress.create({
              data: {
                partnerId: existing.id,
                name: p.name,
                text: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                area: p.address,
                city: "Ahmedabad",
                state: "Gujarat",
              },
            });
            console.log(`[SEED] Created clinic address for: ${existing.name}`);
          } else {
            await prisma.clinicAddress.update({
              where: { id: existingClinicAddr.id },
              data: {
                name: p.name,
                text: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                area: p.address,
                city: "Ahmedabad",
                state: "Gujarat",
              },
            });
            console.log(`[SEED] Updated clinic address for: ${existing.name}`);
          }
        }
      }
    }
    
    console.log("[SEED] Partners seeding complete. Total 15 partners seeded/updated.");
  } catch (error) {
    console.error("[SEED] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPartners();
