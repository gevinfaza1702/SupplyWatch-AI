import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SimulationResultRow } from "@/types/database";

export const dynamic = "force-dynamic";

export type SimulationHistoryItem = {
  id: string;
  productName: string;
  sellingPrice: number | null;
  currentCost: number | null;
  currentMargin: number | null;
  targetMargin: number | null;
  estimatedNewCost: number | null;
  estimatedNewMargin: number | null;
  recommendedPrice: number | null;
  aiExplanation: string | null;
  createdAt: string;
};

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi di environment server." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login diperlukan untuk melihat riwayat simulasi." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("simulation_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json(
      { error: "Riwayat simulasi gagal dimuat.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    simulations: ((data ?? []) as SimulationResultRow[]).map(mapSimulationRow),
  });
}

function mapSimulationRow(row: SimulationResultRow): SimulationHistoryItem {
  return {
    id: row.id,
    productName: row.product_name ?? "Produk tanpa nama",
    sellingPrice: row.selling_price,
    currentCost: row.current_cost,
    currentMargin:
      row.selling_price && row.current_cost
        ? ((row.selling_price - row.current_cost) / row.selling_price) * 100
        : null,
    targetMargin: row.target_margin,
    estimatedNewCost: row.estimated_new_cost,
    estimatedNewMargin: row.estimated_new_margin,
    recommendedPrice: row.recommended_price,
    aiExplanation: row.ai_explanation,
    createdAt: row.created_at,
  };
}
