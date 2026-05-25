import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const connectionString = process.env.DATABASE_URL;

async function update() {
  if (!connectionString) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }
  
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const phone = '2562546247';
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name: 'crispy' },
    create: { phone, name: 'crispy' }
  });
  
  // Check for pet
  const existingPets = await prisma.pet.findMany({
    where: { userId: user.id }
  });
  
  if (existingPets.length === 0) {
    await prisma.pet.create({
      data: {
        userId: user.id,
        name: 'Fluffy',
        type: 'cat',
        breed: 'Mixed',
        age: 2,
        weight: 8
      }
    });
  } else {
    // Update the first one
    await prisma.pet.update({
      where: { id: existingPets[0].id },
      data: { name: 'Fluffy' }
    });
  }
  
  console.log('User and Pet updated!');
}

update().catch(console.error);
