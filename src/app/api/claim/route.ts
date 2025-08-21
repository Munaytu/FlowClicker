import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { player, amount, txHash, clicks } = await req.json();

    if (!player || !amount || !txHash || clicks === undefined) {
      return NextResponse.json({ error: "Player address, amount, txHash, and clicks are required" }, { status: 400 });
    }

    // Actualizar Supabase
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('total_claimed, claimed_clicks')
      .eq('id', player)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found
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
      // Si esto falla, la transacción ya está en la blockchain, lo que no es ideal.
      // La lógica de reconciliación en el frontend ayudará a mitigar esto.
      console.error(`Failed to update DB for user ${player} after claim: ${updateError.message}`);
      // No lanzamos un error al cliente porque la transacción on-chain tuvo éxito.
    }

    console.log(`Database updated for user ${player}.`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in claim API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to database", details: errorMessage }, { status: 500 });
  }
}