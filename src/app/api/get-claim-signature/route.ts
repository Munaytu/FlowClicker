import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { redis } from "@/lib/redis";
import { contractAbi, contractAddress } from "@/lib/contract-config";
import { z } from "zod";
import * as jose from "jose";
import { sonicMainnet } from "@/lib/wagmi";

const claimSignatureSchema = z.object({
  player: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid player address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = claimSignatureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { player } = validation.data;

    const userClicksKey = `user:${player}:clicks`;
    const clicksStr = await redis.get(userClicksKey);
    const clicks = parseInt(String(clicksStr) || "0", 10);

    if (clicks === 0) {
      return NextResponse.json({ error: "No clicks to claim" }, { status: 400 });
    }

    const privateKey = process.env.OWNER_PRIVATE_KEY;
    if (!privateKey) {
      console.error("OWNER_PRIVATE_KEY is not set in .env.local");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
        console.error("JWT_SECRET_KEY is not set in .env.local");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: sonicMainnet,
      transport: http(),
    });

    let nonce;
    try {
      nonce = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'nonces',
        args: [player as `0x${string}`],
      });
    } catch (e) {
      console.error("Failed to read nonce", e);
      throw e;
    }

    const walletClient = createWalletClient({
      account,
      chain: sonicMainnet,
      transport: http(),
    });

    const domain = {
      name: "FlowClicker",
      version: "1",
      chainId: sonicMainnet.id,
      verifyingContract: contractAddress,
    } as const;

    const types = {
      Claim: [
        { name: "player", type: "address" },
        { name: "clicks", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    } as const;

    const message = {
      player: player as `0x${string}`,
      clicks: BigInt(clicks),
      nonce: nonce as bigint,
    } as const;

    const signature = await walletClient.signTypedData({
      account,
      domain,
      types,
      primaryType: "Claim",
      message,
    });

    await redis.set(userClicksKey, 0);

    const secret = new TextEncoder().encode(jwtSecret as string);
    const token = await new jose.SignJWT({ player, clicks })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

    return NextResponse.json({ signature, nonce: nonce.toString(), clicks, token });

  } catch (error) {
    console.error("Error in get-claim-signature API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate signature", details: errorMessage }, { status: 500 });
  }
}
