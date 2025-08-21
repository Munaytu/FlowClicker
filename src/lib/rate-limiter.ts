import { redis } from '@/lib/redis';
import { NextRequest } from 'next/server';

// Simple fixed-window rate limiter
export async function checkRateLimit(req: NextRequest) {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const windowInSeconds = process.env.RATE_LIMIT_WINDOW_SECONDS ? parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 10) : 60; // 1 minute window
  const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : 1000; // Max 1000 requests per minute from a single IP

  const key = `rate_limit:${ip}`;

  const currentRequests = await redis.get(key);

  if (currentRequests && Number(currentRequests) >= maxRequests) {
    return false; // Limit exceeded
  }

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, windowInSeconds);
  await pipeline.exec();

  return true; // Within limit
}
