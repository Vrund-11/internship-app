import { prisma } from "../utils/prisma";

async function seedPromo() {
  const existing = await prisma.promoCode.findUnique({
    where: { code: "PAWS20" },
  });

  if (!existing) {
    await prisma.promoCode.create({
      data: {
        code: "PAWS20",
        discountPercent: 10,
        maxUsesPerUser: 3,
        isActive: true,
      },
    });
    console.log("[SEED] Created PAWS20 promo code (10% off, 3 uses per user)");
  } else {
    console.log("[SEED] PAWS20 already exists");
  }
}

seedPromo()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
