
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // This is a dangerous operation, so we should protect it.
  // For now, we'll just check for a secret in the request body.
  const { secret } = await req.json();
  if (secret !== 'flow-clicker-super-secret') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Reset Redis
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: 'user:*:clicks' });
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      cursor = parseInt(nextCursor, 10);
    } while (cursor !== 0);

    // Reset Supabase
    console.log("Attempting to reset Supabase...");
    const { data, error } = await supabase
      .from('users')
      .update({ total_clicks: 0, total_claimed: 0 })
      .neq('id', '0x0') // Update all rows
      .select(); // select() will return the updated rows

    if (error) {
      console.error("Supabase reset failed:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log("Supabase reset successful. Updated rows:", data);

    return NextResponse.json({ message: 'Data reset successfully' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
