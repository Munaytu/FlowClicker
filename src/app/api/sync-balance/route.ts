import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { createPublicClient, http, formatUnits } from 'viem';
import { defineChain } from 'viem';
import { contractAbi, contractAddress } from '@/lib/contract-config';

const syncBalanceBodySchema = z.object({
  userId: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid userId"),
});

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

export async function POST(req: NextRequest) {
  try {
    // API Key Authentication (same as /api/click)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }
    const apiKey = authHeader.substring(7);
    const validApiKeys = (process.env.VALID_API_KEYS || "").split(',');

    if (!validApiKeys.includes(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const body = await req.json();
    const validation = syncBalanceBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { userId } = validation.data;

    // 1. Get on-chain balance
    const balanceOfResult = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [userId as `0x${string}`],
    });

    const onChainBalance = parseFloat(formatUnits(balanceOfResult as bigint, 18));

    // 2. Update Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_claimed: onChainBalance })
      .eq('id', userId);

    if (updateError) {
      console.error(`Supabase error updating balance for user ${userId}:`, updateError);
      return NextResponse.json({ error: "Failed to update balance in database.", details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, syncedBalance: onChainBalance });

  } catch (error) {
    console.error('Error in /api/sync-balance endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
