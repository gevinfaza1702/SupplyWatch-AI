// =============================================================================
// GET /api/commodities/[id] — commodity detail + historical prices + risk
// (Phase 5)
//
// `[id]` accepts a slug (e.g. "wheat") or a UUID.
// Query params:
//   ?business=bakery|coffee_shop|restaurant   (optional) weight risk by business
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCommodityDetail } from "@/lib/commodities/get-commodities";
import type { BusinessType } from "@/types/database";

export const dynamic = "force-dynamic";

const VALID_BUSINESS: BusinessType[] = ["bakery", "coffee_shop", "restaurant"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const businessParam = req.nextUrl.searchParams.get("business");
  const businessType =
    businessParam && (VALID_BUSINESS as string[]).includes(businessParam)
      ? (businessParam as BusinessType)
      : undefined;

  try {
    const result = await getCommodityDetail(id, businessType);
    if (!result) {
      return NextResponse.json(
        { error: `Komoditas "${id}" tidak ditemukan.` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      source: result.source,
      businessType: businessType ?? null,
      commodity: result.detail,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat detail komoditas." },
      { status: 500 },
    );
  }
}
