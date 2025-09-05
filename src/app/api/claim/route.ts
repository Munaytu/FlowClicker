import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as jose from "jose";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createPublicClient, http, formatUnits, Hash, decodeEventLog } from 'viem';
import { defineChain } from 'viem';
import { contractAbi, contractAddress } from "@/lib/contract-config";

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

    const { txHash, amount } = validation.data as { txHash: `0x${string}`, amount: string };
    const userClicksKey = `user:${userId}:clicks`;

    // Authoritative read from Redis
    const clicksToClaim = Number(await redis.get(userClicksKey) || 0);

    if (clicksToClaim <= 0) {
      return NextResponse.json({ error: "No clicks to claim" }, { status: 400 });
    }

    // --- Blockchain Verification Start ---
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

    const publicClient = createPublicClient({
      chain: sonic,
      transport: http(),
    });

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hash });

      if (!receipt || receipt.status !== 'success') {
        return NextResponse.json({ error: "Blockchain transaction failed or not found." }, { status: 400 });
      }

      const tokensClaimedEvent = contractAbi.find(
        (item: any) => item.type === 'event' && item.name === 'TokensClaimed'
      );

      if (!tokensClaimedEvent) {
        console.error("TokensClaimed event not found in ABI.");
        return NextResponse.json({ error: "Internal server error: TokensClaimed event ABI missing." }, { status: 500 });
      }

      let verifiedAmount: bigint | undefined;
      let verifiedClicks: bigint | undefined;
      let verifiedPlayer: `0x${string}` | undefined;

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
            continue;
        }
        try {
          const decodedLog = decodeEventLog({
            abi: [tokensClaimedEvent],
            data: log.data,
            topics: log.topics,
          });

          if (decodedLog.eventName === 'TokensClaimed') {
            verifiedPlayer = (decodedLog.args as any).player;
            verifiedAmount = (decodedLog.args as any).amount;
            verifiedClicks = (decodedLog.args as any).clicks;
            break;
          }
        } catch (decodeError) {
          continue;
        }
      }

      if (!verifiedAmount || !verifiedClicks || !verifiedPlayer) {
        return NextResponse.json({ error: "Could not verify claim details from blockchain transaction logs." }, { status: 400 });
      }

      const checksumUserId = userId.toLowerCase();

      if (verifiedPlayer.toLowerCase() !== checksumUserId) {
        return NextResponse.json({ error: "Claim initiated by a different address than authenticated user." }, { status: 403 });
      }

      const onChainAmount = parseFloat(formatUnits(verifiedAmount, 18));
      const onChainClicks = Number(verifiedClicks);

      if (onChainAmount !== parseFloat(amount)) {
        console.warn(`Discrepancy: Requested amount ${amount} vs On-chain amount ${onChainAmount} for user ${userId}`);
      }

      if (onChainClicks !== clicksToClaim) {
        console.warn(`Discrepancy: Requested clicks ${clicksToClaim} vs On-chain clicks ${onChainClicks} for user ${userId}`);
      }

      // --- Blockchain Verification End ---

      // --- Update Supabase with verified on-chain data ---
      const balanceOfResult = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'balanceOf',
        args: [userId as `0x${string}`],
      });

      const currentOnChainBalance = parseFloat(formatUnits(balanceOfResult as bigint, 18));

      const { error: updateError } = await supabase
        .from('users')
        .update({ total_claimed: currentOnChainBalance })
        .eq('id', userId);

      if (updateError) {
        console.error(`Supabase error updating total_claimed for user ${userId}:`, updateError);
        return NextResponse.json({ error: "Failed to update total_claimed in database.", details: updateError.message }, { status: 500 });
      }

      const { data, error: rpcError } = await supabase.rpc('claim_rewards', {
        p_user_id: userId,
        p_clicks_to_claim: onChainClicks,
      }).single();

      const rpcData = data as ClaimRewardsResponse;

      if (rpcError || !rpcData || !rpcData.success) {
        const errorMessage = rpcError?.message || (rpcData as any)?.message || "An unknown RPC error occurred";
        console.error(`RPC Error for user ${userId}:`, errorMessage);
        return NextResponse.json({ error: "Failed to process claim in database", details: errorMessage }, { status: 500 });
      }

      const currentRedisClicks = Number(await redis.get(userClicksKey) || 0);
      const newRedisClicks = Math.max(0, currentRedisClicks - onChainClicks);
      await redis.set(userClicksKey, newRedisClicks);

      console.log(`Successfully claimed ${onChainClicks} clicks. Redis clicks updated from ${currentRedisClicks} to ${newRedisClicks} for user ${userId}.`);

      return NextResponse.json({ claimedAmount: onChainAmount, claimedClicks: onChainClicks, new_total_claimed: currentOnChainBalance, success: rpcData.success, message: rpcData.message });

    } catch (error) {
      console.error("Unhandled error in /api/claim endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Unhandled error in /api/claim endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
