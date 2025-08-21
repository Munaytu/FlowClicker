import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as jose from "jose";
import { z } from "zod";

const claimBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  amount: z.string(), // The amount from the contract event
});

interface AuthenticatedRequest extends NextRequest {
  user?: {
    player: string;
    clicks: number;
  };
}

// Middleware for JWT verification
async function verifyJwt(req: AuthenticatedRequest, res: NextResponse) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Authorization token not provided" }, { status: 401 });
  }

  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (!jwtSecret) {
    console.error("JWT_SECRET_KEY is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    req.user = {
      player: payload.player as string,
      clicks: payload.clicks as number,
    };
    return null; // Indicates success
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export async function POST(req: AuthenticatedRequest) {
  try {
    const verificationResponse = await verifyJwt(req, new NextResponse());
    if (verificationResponse) {
      return verificationResponse;
    }

    const { player, clicks } = req.user!;
    const body = await req.json();
    const validation = claimBodySchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { amount } = validation.data;

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('total_claimed, claimed_clicks')
      .eq('id', player)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error fetching user from DB: ${fetchError.message}`);
    }

    const currentClaimed = userData?.total_claimed || 0;
    const newTotalClaimed = currentClaimed + parseFloat(amount);
    const currentClaimedClicks = userData?.claimed_clicks || 0;
    const newTotalClaimedClicks = currentClaimedClicks + clicks;

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        total_claimed: newTotalClaimed,
        claimed_clicks: newTotalClaimedClicks
      })
      .eq('id', player);

    if (updateError) {
      console.error(`Failed to update DB for user ${player} after claim: ${updateError.message}`);
    }

    console.log(`Database updated for user ${player}.`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in claim API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to database", details: errorMessage }, { status: 500 });
  }
}