import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createPublicClient, http, formatUnits } from 'viem';
import { defineChain } from 'viem';
import { contractAbi, contractAddress } from "@/lib/contract-config";
import * as jose from "jose"; // For authentication

// Define the Sonic chain
const sonic = defineChain({
  id: 146,
  name: 'Sonic',
  nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
});

// Initialize viem public client
const publicClient = createPublicClient({
  chain: sonic,
  transport: http(),
});

interface AuthenticatedRequest extends NextRequest {
  user?: {
    player: string;
  };
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

/**
 * @description This API endpoint reconciles a user's 'total_claimed' in Supabase
 * with their actual token balance on the Sonic blockchain.
 * 
 * IMPORTANT: After this change, 'total_claimed' in the 'users' table
 * now represents the user's *total token holdings* on the blockchain,
 * not just tokens claimed via the app.
 * 
 * This endpoint can be triggered by an authenticated user to update their own balance.
 * For admin-triggered reconciliation of other users, additional authorization logic would be needed.
 */
export async function GET(req: AuthenticatedRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or missing authorization token" }, { status: 401 });
    }

    // Read the user's current token balance from the blockchain
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [userId as `0x${string}`], // Cast userId to address type
    });

    // Convert balance from bigint (wei) to a number, assuming 18 decimals
    const onChainBalance = parseFloat(formatUnits(balance, 18));

    // Update the user's total_claimed in Supabase
    const { data, error: supabaseError } = await supabase
      .from('users')
      .update({ total_claimed: onChainBalance })
      .eq('id', userId)
      .select();

    if (supabaseError) {
      console.error(`Supabase error updating total_claimed for user ${userId}:`, supabaseError);
      return NextResponse.json({ error: "Failed to update balance in database." }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found in database." }, { status: 404 });
    }

    console.log(`Reconciled total_claimed for user ${userId}. New balance: ${onChainBalance}`);
    return NextResponse.json({
      success: true,
      message: "Balance reconciled successfully.",
      new_total_claimed: onChainBalance,
    });

  } catch (error) {
    console.error("Unhandled error in /api/reconcile-balance endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}