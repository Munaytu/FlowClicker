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

    const clicksBigInt = BigInt(clicks);
    const claimableAmount = clicksBigInt * (currentReward as bigint ?? 0n);

    return NextResponse.json({
      claimableAmount: formatUnits(claimableAmount, (decimals as number) ?? 18),
      currentRewardPerClick: formatUnits((currentReward as bigint) ?? 0n, (decimals as number) ?? 18),
      decay: {
        initialReward: formatUnits((initialReward as bigint) ?? 0n, (decimals as number) ?? 18),
        finalReward: formatUnits((finalReward as bigint) ?? 0n, (decimals as number) ?? 18),
        decayDurationInDays: Number((decayDuration as bigint) ?? 0n) / 86400,
        launchTimestamp: Number((launchTime as bigint) ?? 0n),
      },
    });

  } catch (error: any) {
    console.error('Error in get-claimable-amount API:', error);
    return NextResponse.json({ error: 'Failed to fetch claimable amount', details: error.message }, { status: 500 });
  }
}
