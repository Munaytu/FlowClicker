import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as jose from "jose";
import { z } from "zod";
import { redis } from "@/lib/redis";

const claimBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number string",
  }),
});

interface AuthenticatedRequest extends NextRequest {
  user?: {
    player: string;
  };
}

// Type definition for the data returned from the Supabase RPC function
interface ClaimRewardsResponse {
  success: boolean;
  message: string;
  new_total_claimed: number;
  new_claimed_clicks: number;
}

// Simplified JWT verification to get the user ID
async function getUserIdFromToken(req: AuthenticatedRequest): Promise<string | null> {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (!jwtSecret) {
    console.error("JWT_SECRET_KEY is not set");
    return null;
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.player as string;
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return null;
  }
}

export async function POST(req: AuthenticatedRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or missing authorization token" }, { status: 401 });
    }

    const body = await req.json();
    const validation = claimBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { amount } = validation.data;
    const userClicksKey = `user:${userId}:clicks`;

    // Authoritative read from Redis
    const clicksToClaim = Number(await redis.get(userClicksKey) || 0);

    if (clicksToClaim <= 0) {
      return NextResponse.json({ error: "No clicks to claim" }, { status: 400 });
    }

    // Call the atomic RPC function in Supabase
    const { data, error: rpcError } = await supabase.rpc('claim_rewards', {
      p_user_id: userId,
      p_amount_to_claim: parseFloat(amount),
      p_clicks_to_claim: clicksToClaim,
    }).single();

    // Cast the response data to our defined type
    const rpcData = data as unknown as ClaimRewardsResponse | null;

    if (rpcError || !rpcData || !rpcData.success) {
      const errorMessage = rpcError?.message || rpcData?.message || "An unknown RPC error occurred";
      console.error(`RPC Error for user ${userId}:`, errorMessage);
      return NextResponse.json({ error: "Failed to process claim in database", details: errorMessage }, { status: 500 });
    }

    // If the transaction was successful, reset the clicks in Redis
    await redis.set(userClicksKey, 0);

    console.log(`Successfully claimed ${clicksToClaim} clicks and ${amount} tokens for user ${userId}.`);

    return NextResponse.json({ claimedAmount: amount, claimedClicks: clicksToClaim, ...rpcData });

  } catch (error) {
    console.error("Unhandled error in /api/claim endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}