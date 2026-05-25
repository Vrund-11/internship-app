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
        name: "Dr. Aditi (Vet)",
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
      },
      {
        name: "Suresh (Groomer)",
        phone: "9876543211",
        latitude: 23.0300, 
        longitude: 72.5800,
        address: "Mobile Grooming Van",
        isOnline: true,
        isVerified: true,
        rating: 4.5,
        totalCompleted: 320,
        services: [ServiceType.GROOMING]
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
        // Update existing with address
        await prisma.partner.update({
          where: { id: existing.id },
          data: {
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
          }
        });
        console.log(`[SEED] Updated partner: ${existing.name}`);
      }
    }
    
    console.log("[SEED] Partners seeding complete.");
  } catch (error) {
    console.error("[SEED] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPartners();
