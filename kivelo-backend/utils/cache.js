// utils/cache.js
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || null;
let redis = null;

if (redisUrl) {
  redis = new Redis(redisUrl);
  redis.on("error", (e) => console.warn("Redis error:", e.message));
} else {
  console.warn("REDIS_URL not set — falling back to in-memory cache");
}

const memoryCache = new Map();

export const getCache = async (key) => {
  if (redis) {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } else {
    const e = memoryCache.get(key);
    if (!e) return null;
    if (e.expire && Date.now() > e.expire) {
      memoryCache.delete(key);
      return null;
    }
    return e.value;
  }
};

export const setCache = async (key, value, ttlSeconds = 30) => {
  if (redis) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } else {
    memoryCache.set(key, { value, expire: Date.now() + ttlSeconds * 1000 });
  }
};

export const delCache = async (key) => {
  if (redis) {
    await redis.del(key);
  } else {
    memoryCache.delete(key);
  }
};
