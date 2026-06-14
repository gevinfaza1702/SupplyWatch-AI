// =============================================================================
// GET /api/commodities — list commodities with latest price + risk (Phase 5)
//
// Query params:
//   ?business=<business_type>   (optional) weight risk by business
//
// Returns risk computed by the Risk Engine. Falls back to mock data when
// Supabase is not configured (response includes `source`).
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCommodities } from "@/lib/commodities/get-commodities";
import { isBusinessType } from "@/lib/business-types";
import type { BusinessType } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const businessParam = req.nextUrl.searchParams.get("business");
  const businessType =
    businessParam && isBusinessType(businessParam)
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
