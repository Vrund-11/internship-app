import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const connectionString = process.env.DATABASE_URL;

async function run() {
  if (!connectionString) {
    console.error("No DATABASE_URL configured in .env");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching all users...");
  const users = await prisma.user.findMany({
    include: {
      pets: true,
      sessions: true,
    }
  });

  console.log("=== DB Users ===");
  for (const user of users) {
    console.log(`ID: ${user.id} | Phone: ${user.phone} | Name: ${user.name}`);
    console.log(`Pets: ${JSON.stringify(user.pets)}`);
    console.log(`Sessions count: ${user.sessions.length}`);
    console.log("-----------------------------------------");
  }
}

run().catch(console.error);
