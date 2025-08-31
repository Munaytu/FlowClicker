import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, defineChain } from 'viem';
import { contractAbi, contractAddress } from '@/lib/contract-config';

export const revalidate = 10; // Revalidate every 10 seconds

const sonicMainnet = defineChain({
  id: 146,
  name: 'Sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://sonic.drpc.org'],
    },
  },
  blockExplorers: {
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
});

export async function POST(request: Request) {
  const { clicks = 0 } = await request.json(); // Clicks is now optional, defaults to 0

  try {
    const publicClient = createPublicClient({
      chain: sonicMainnet,
      transport: http(),
    });

    const readContractCall = (functionName: any) => publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName,
    });

    const [
      currentReward,
      decimals,
      initialReward,
      finalReward,
      decayDuration,
      launchTime
    ] = await Promise.all([
      readContractCall('getCurrentReward'),
      readContractCall('decimals'),
      readContractCall('INITIAL_REWARD_PER_CLICK'),
      readContractCall('FINAL_REWARD_PER_CLICK'),
      readContractCall('DECAY_DURATION_SECONDS'),
      readContractCall('launchTime'),
    ]);

    const clicksBigInt = BigInt(clicks ?? 0);
    const claimableAmount = clicksBigInt * (BigInt(currentReward ?? 0));

    return NextResponse.json({
      claimableAmount: formatUnits(claimableAmount, Number(decimals ?? 18)),
      currentRewardPerClick: formatUnits(BigInt(currentReward ?? 0), Number(decimals ?? 18)),
      decay: {
        initialReward: formatUnits(BigInt(initialReward ?? 0), Number(decimals ?? 18)),
        finalReward: formatUnits(BigInt(finalReward ?? 0), Number(decimals ?? 18)),
        decayDurationInDays: Number(BigInt(decayDuration ?? 0)) / 86400,
        launchTimestamp: Number(BigInt(launchTime ?? 0)),
      },
    });

  } catch (error: any) {
    console.error('Error in get-claimable-amount API:', error);
    return NextResponse.json({ error: 'Failed to fetch claimable amount', details: error.message }, { status: 500 });
  }
}
