import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import app from "./app";
import { connectRedis } from "./utils/redis";

// Connect to Redis
connectRedis();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

