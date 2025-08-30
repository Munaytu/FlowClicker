import { Redis } from '@upstash/redis';

let redis: Redis;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} else {
  console.warn("Redis environment variables not set. Redis client not initialized.");
  // Provide a mock client for build purposes
  redis = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
    incr: () => Promise.resolve(0),
    decr: () => Promise.resolve(0),
    limit: () => ({
        limit: () => Promise.resolve({ success: true, limit: 0, remaining: 0, reset: 0 }),
    })
  } as any;
}

export { redis };
