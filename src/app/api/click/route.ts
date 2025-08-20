
import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userKey = `user:${userId}:clicks`;
  const newClicks = await redis.incr(userKey);

  return NextResponse.json({ clicks: newClicks });
}
