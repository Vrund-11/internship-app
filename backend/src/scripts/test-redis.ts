import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { redisClient, connectRedis } from "../utils/redis";

async function main() {
  console.log("Starting Redis Connection Test...");
  console.log(`Targeting URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`);
  
  await connectRedis();
  
  const testKey = "test:connection";
  const testValue = "Canovet Redis Test Works! 🐾";
  
  try {
    console.log(`Setting key '${testKey}' to value '${testValue}'...`);
    await redisClient.setEx(testKey, 10, testValue);
    
    console.log("Reading key back from Redis...");
    const retrieved = await redisClient.get(testKey);
    console.log(`Retrieved value: "${retrieved}"`);
    
    if (retrieved === testValue) {
      console.log("✅ SUCCESS: Redis read & write verified successfully!");
    } else {
      console.log("❌ ERROR: Retrieved value does not match sent value.");
    }
    
    console.log("Cleaning up test key...");
    await redisClient.del(testKey);
    console.log("Cleanup complete.");
    
  } catch (err) {
    console.error("❌ Redis Test Execution Failed:", err);
  } finally {
    try {
      await redisClient.disconnect();
      console.log("Redis disconnected.");
    } catch {}
  }
}

main().catch(console.error);
