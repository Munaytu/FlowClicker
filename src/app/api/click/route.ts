import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.tokenBucket(50, "1s", 25), // Burst of 50, refills 25 per second.
  analytics: true,
  prefix: '@upstash/ratelimit',
});

const clickBodySchema = z.object({
    userId: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid userId"),
    country: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = clickBodySchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { userId, country } = validation.data;

    const { success, limit, remaining } = await ratelimit.limit(userId);
    if (!success) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
            },
        });
    }

    const [redisResponse, supabaseResponse] = await Promise.all([
      redis.incr(`user:${userId}:clicks`),
      supabase.rpc('increment_clicks', { p_user_id: userId, p_country_code: country })
    ]);

    const newClicks = redisResponse;
    const { error: rpcError } = supabaseResponse;

    if (rpcError) {
      console.error('Error calling increment_clicks function:', rpcError);
      await redis.decr(`user:${userId}:clicks`);
      return new NextResponse('Internal Server Error from Supabase RPC', { status: 500 });
    }

    return NextResponse.json({ clicks: newClicks });
  } catch (error) {
    console.error('Error in /api/click endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
