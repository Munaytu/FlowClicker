import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { z } from "zod";

const playerSchema = z.object({
  player: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid player address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = playerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
    }

    const { player } = validation.data;
    const userClicksKey = `user:${player}:clicks`;
    const clicksStr = await redis.get(userClicksKey);
    const clicks = parseInt(String(clicksStr) || "0", 10);

    return NextResponse.json({ clicks });

  } catch (error) {
    console.error("Error in get-redis-clicks API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to get clicks from Redis", details: errorMessage }, { status: 500 });
  }
}