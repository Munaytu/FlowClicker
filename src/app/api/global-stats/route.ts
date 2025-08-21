import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, defineChain } from 'viem';
import { contractAbi, contractAddress } from '@/lib/contract-config';
import { supabase } from '@/lib/supabase';

export const revalidate = 60; // Revalidate every 60 seconds

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

async function getOnChainData(publicClient: any) {
  const readContractCall = (functionName: any, args: any[] = []) => publicClient.readContract({
    address: contractAddress,
    abi: contractAbi,
    functionName,
    args,
  });

  const [
    totalSupply,
    devWalletAddress,
    foundationWalletAddress,
    burnAddress,
    devFeeBps,
    foundationFeeBps,
    burnFeeBps,
    decimals,
  ] = await Promise.all([
    readContractCall('totalSupply'),
    readContractCall('devWallet'),
    readContractCall('foundationWallet'),
    readContractCall('BURN_ADDRESS'),
    readContractCall('DEV_FEE_BPS'),
    readContractCall('FOUNDATION_FEE_BPS'),
    readContractCall('BURN_FEE_BPS'),
    readContractCall('decimals'),
  ]);

  const [
    devWalletBalance,
    foundationWalletBalance,
    burnWalletBalance,
  ] = await Promise.all([
    readContractCall('balanceOf', [devWalletAddress]),
    readContractCall('balanceOf', [foundationWalletAddress]),
    readContractCall('balanceOf', [burnAddress]),
  ]);

  const totalFeeBps = (devFeeBps ?? 0n) + (foundationFeeBps ?? 0n) + (burnFeeBps ?? 0n);
  const totalInitialSupply = totalSupply ?? 0n;
  
  // This is the supply that was NOT allocated to fees, i.e., what went to players
  const circulatingSupply = totalInitialSupply - (devWalletBalance ?? 0n) - (foundationWalletBalance ?? 0n) - (burnWalletBalance ?? 0n);

  console.log({ 
    totalSupply: formatUnits(totalInitialSupply, decimals),
    totalClaimed: formatUnits(circulatingSupply, decimals),
  });

  return {
    totalSupply: formatUnits(totalInitialSupply, decimals),
    totalClaimed: formatUnits(circulatingSupply, decimals), // Using circulating supply as the "claimed" amount by players
    tokenomics: {
      devFeeBps: Number(devFeeBps ?? 0n),
      foundationFeeBps: Number(foundationFeeBps ?? 0n),
      burnFeeBps: Number(burnFeeBps ?? 0n),
      totalFeeBps: Number(totalFeeBps),
    }
  };
}

async function getOffChainData() {
  const { data, error } = await supabase
    .from('users')
    .select('total_clicks');

  if (error) {
    console.error('Error fetching total clicks:', error);
    return { totalClicksAllTime: 0 };
  }

  const totalClicks = data.reduce((acc, user) => acc + user.total_clicks, 0);
  return { totalClicksAllTime: totalClicks };
}

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: sonicMainnet,
      transport: http(),
    });

    const [onChainData, offChainData] = await Promise.all([
      getOnChainData(publicClient),
      getOffChainData(),
    ]);

    return NextResponse.json({
      ...onChainData,
      ...offChainData,
    });
  } catch (error) {
    console.error('Error in global-stats API:', error);
    return NextResponse.json({ error: 'Failed to fetch global stats' }, { status: 500 });
  }
}
