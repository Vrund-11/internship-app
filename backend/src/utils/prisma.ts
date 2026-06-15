import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

let pool: Pool;
if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString,
    max: 10,
  });
} else {
  if (!globalThis.pgPoolGlobal) {
    globalThis.pgPoolGlobal = new Pool({
      connectionString,
      max: 10,
    });
  }
  pool = globalThis.pgPoolGlobal;
}

let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.prismaGlobal) {
    const adapter = new PrismaPg(pool);
    globalThis.prismaGlobal = new PrismaClient({ adapter });
  }
  prisma = globalThis.prismaGlobal;
}

export { prisma };

