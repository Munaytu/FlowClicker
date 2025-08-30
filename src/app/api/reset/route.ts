import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

// This is a temporary endpoint to reset the Redis database.
// It should be removed after use.
export async function POST() {
  try {
    // Check for a secret key to prevent unauthorized access
    // In a real production scenario, you would use a more secure method
    // like checking for an admin session or using a secret header.
    // For this one-time reset, we'll keep it simple.

    await redis.flushdb();

    return NextResponse.json({ message: 'Redis database has been reset.' });
  } catch (error) {
    console.error('Error resetting Redis:', error);
    return NextResponse.json({ message: 'Error resetting Redis.' }, { status: 500 });
  }
}