import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const connectionString = process.env.DATABASE_URL;

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91")) {
    return cleaned;
  }
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return "+" + cleaned;
  }
  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }
  return cleaned;
}

async function run() {
  if (!connectionString) {
    console.error("No DATABASE_URL configured in .env");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching all users from database...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users.`);

  for (const user of users) {
    const normalized = normalizePhone(user.phone);
    if (user.phone === normalized) {
      continue;
    }

    console.log(`Normalizing user ${user.phone} -> ${normalized}...`);

    // Check if user with normalized phone already exists
    const duplicate = await prisma.user.findUnique({
      where: { phone: normalized }
    });

    if (duplicate) {
      console.log(`Found duplicate user record with normalized phone: ${normalized} (ID: ${duplicate.id})`);
      
      const primaryUser = duplicate;
      const obsoleteUser = user;

      // Transfer name if primaryUser does not have one but obsoleteUser does
      const finalName = primaryUser.name || obsoleteUser.name;
      if (finalName !== primaryUser.name) {
        await prisma.user.update({
          where: { id: primaryUser.id },
          data: { name: finalName }
        });
      }

      console.log(`Merging records from obsolete user ${obsoleteUser.id} to primary user ${primaryUser.id}...`);

      // Update foreign keys to reference primary user
      await prisma.userSession.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.pet.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.address.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.booking.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.review.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.complaint.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.promoUsage.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      await prisma.rescheduleLog.updateMany({
        where: { userId: obsoleteUser.id },
        data: { userId: primaryUser.id }
      });

      // Delete the duplicate obsolete user
      await prisma.user.delete({
        where: { id: obsoleteUser.id }
      });

      console.log(`Successfully merged user ${obsoleteUser.phone} into ${primaryUser.phone}.`);
    } else {
      // Just update phone to normalized format
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: normalized }
      });
      console.log(`Updated phone to normalized format for user: ${normalized}`);
    }
  }

  console.log("Database normalization complete!");
}

run().catch(console.error);
