
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId, country } = await req.json();

  if (!userId || !country) {
    return new NextResponse('Unauthorized or missing country', { status: 401 });
  }

  // Perform Supabase and Redis operations in parallel
  const [redisResponse, supabaseResponse] = await Promise.all([
    redis.incr(`user:${userId}:clicks`),
    supabase.rpc('increment_clicks', { p_user_id: userId, p_country_code: country })
  ]);

  const newClicks = redisResponse;
  const { error: rpcError } = supabaseResponse;

  if (rpcError) {
    console.error('Error calling increment_clicks function:', rpcError);
    // If Supabase fails, we should ideally decrement the redis counter to rollback.
    await redis.decr(`user:${userId}:clicks`);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json({ clicks: newClicks });
}
