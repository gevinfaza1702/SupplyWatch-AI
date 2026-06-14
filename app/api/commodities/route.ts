// =============================================================================
// GET /api/commodities — list commodities with latest price + risk (Phase 5)
//
// Query params:
//   ?business=bakery|coffee_shop|restaurant   (optional) weight risk by business
//
// Returns risk computed by the Risk Engine. Falls back to mock data when
// Supabase is not configured (response includes `source`).
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCommodities } from "@/lib/commodities/get-commodities";
import type { BusinessType } from "@/types/database";

export const dynamic = "force-dynamic";

const VALID_BUSINESS: BusinessType[] = ["bakery", "coffee_shop", "restaurant"];

export async function GET(req: NextRequest) {
  const businessParam = req.nextUrl.searchParams.get("business");
  const businessType =
    businessParam && (VALID_BUSINESS as string[]).includes(businessParam)
      ? (businessParam as BusinessType)
      : undefined;

  try {
    const { source, commodities } = await getCommodities(businessType);
    return NextResponse.json({
      source,
      businessType: businessType ?? null,
      count: commodities.length,
      commodities,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat data komoditas." },
      { status: 500 },
    );
  }
}
