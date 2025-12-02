import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";

let redis;

if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        console.warn(`🔄 Redis reconnect attempt #${retries}`);
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redis.on("ready", () => console.log("🚀 Redis connected successfully"));
  redis.on("error", (err) => console.error("❌ Redis Error:", err));
  redis.on("end", () => console.warn("⚠️ Redis connection closed"));

  await redis.connect();
} else {
  console.warn("⚠️ REDIS_URL not set — Redis caching disabled");
}

export default redis;
