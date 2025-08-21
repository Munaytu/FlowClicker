import { NextResponse } from 'next/server';
import { createPublicClient, http, defineChain } from 'viem';

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

const PYTH_CONTRACT_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';
const SONIC_PRICE_ID = '0x2a838dc5843c456a5b501b7303974276622f6843be515c4516f2b04159a2da6a';

const pythAbi = [
  {
    "name": "getPriceUnsafe",
    "type": "function",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "price",
        "type": "tuple",
        "components": [
          { "name": "price", "type": "int64" },
          { "name": "conf", "type": "uint64" },
          { "name": "expo", "type": "int32" },
          { "name": "publishTime", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getPriceNoOlderThan",
    "type": "function",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32"
      },
      {
        "name": "age",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "price",
        "type": "tuple",
        "components": [
          { "name": "price", "type": "int64" },
          { "name": "conf", "type": "uint64" },
          { "name": "expo", "type": "int32" },
          { "name": "publishTime", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "StalePrice",
    "type": "error",
    "inputs": []
  },
  {
    "name": "PriceFeedNotFound",
    "type": "error",
    "inputs": []
  }
] as const;

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: sonicMainnet,
      transport: http(),
    });

    const priceData = await publicClient.readContract({
      address: PYTH_CONTRACT_ADDRESS,
      abi: pythAbi,
      functionName: 'getPriceNoOlderThan',
      args: [SONIC_PRICE_ID, 60]
    });

    const priceValue = Number(priceData.price);
    const priceExpo = Number(priceData.expo);
    
    const finalPrice = priceValue * (10 ** priceExpo);

    return NextResponse.json({ price: finalPrice });

  } catch (error: any) {
    console.error('Error fetching token price from Pyth:', error);
    return NextResponse.json({ error: 'Failed to fetch token price', details: error.message }, { status: 500 });
  }
}
