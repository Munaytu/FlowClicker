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

async function getOrCreateUser(userId: string, country: string) {
  // First, try to select the user
  const { data: user, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 is the code for "No rows found"
    console.error('Error selecting user:', selectError);
    throw new Error('Failed to check for user in database.');
  }

  if (user) {
    // User exists, return it
    return user;
  }

  // User does not exist, create them
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      country: country,
      total_clicks: 0, // Start with 0, increment will be handled by RPC
      total_claimed: 0,
      claimed_clicks: 0,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating user:', insertError);
    throw new Error('Failed to create user in database.');
  }

  return newUser;
}

export async function POST(req: NextRequest) {
  try {
    // API Key Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }
    const apiKey = authHeader.substring(7); // Remove "Bearer "
    const validApiKeys = (process.env.VALID_API_KEYS || "").split(',');

    if (!validApiKeys.includes(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

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

    // Ensure user exists before proceeding
    await getOrCreateUser(userId, country);

    const [redisResponse, supabaseResponse] = await Promise.all([
      redis.incr(`user:${userId}:clicks`),
      supabase.rpc('increment_clicks', { p_user_id: userId, p_country_code: country })
    ]);

    const newClicks = redisResponse;
    const { error: rpcError } = supabaseResponse;

    if (rpcError) {
      console.error('Error calling increment_clicks function:', rpcError);
      await redis.decr(`user:${userId}:clicks`);
      const errorMessage = process.env.NODE_ENV !== 'production' ? rpcError.message : 'Internal Server Error from Supabase RPC';
      return new NextResponse(errorMessage, { status: 500 });
    }

    return NextResponse.json({ clicks: newClicks });
  } catch (error) {
    console.error('Error in /api/click endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(errorMessage, { status: 500 });
  }
}