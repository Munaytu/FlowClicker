
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userKey = `user:${userId}:clicks`;
  const pendingClicks = await redis.get(userKey);

  if (!pendingClicks || pendingClicks === 0) {
    return new NextResponse('No clicks to claim', { status: 400 });
  }

  await redis.set(userKey, 0);

  const { data, error } = await supabase
    .from('users')
    .select('total_claimed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user', error);
    // Rollback redis operation if supabase fails
    await redis.set(userKey, pendingClicks);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const newTotalClaimed = data.total_claimed + Number(pendingClicks);

  const { error: updateError } = await supabase
    .from('users')
    .update({ total_claimed: newTotalClaimed })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating user', updateError);
    // Rollback redis operation if supabase fails
    await redis.set(userKey, pendingClicks);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json({ claimed: Number(pendingClicks) });
}
