// =============================================================================
// SupplyWatch AI — Commodity data layer (Phase 5)
//
// Single source of truth for commodity summaries/detail + risk, used by the
// dashboard and both /api/commodities routes. Supabase-first with mock fallback
// (same pattern as the dashboard). Applies the full Risk Engine, optionally
// weighted by a business type's commodity weights.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-mode";
import {
  getMockCommodities,
  getMockPrices,
  getMockExchangeRates,
} from "@/lib/data-sources/mock-source";
import {
  calculateRiskFromSeries,
  type RiskResult,
} from "@/lib/risk/calculate-risk";
import type {
  CommodityRow,
  CommodityPriceRow,
  ExchangeRateRow,
  BusinessType,
} from "@/types/database";
import type {
  CommoditySummary,
  CommodityDetail,
  PricePoint,
} from "@/types/commodity";

export type DataSource = "supabase" | "mock";

interface RawBundle {
  source: DataSource;
  commodities: CommodityRow[];
  pricesByCommodity: Map<string, CommodityPriceRow[]>;
  fxMomChange: number | null;
  exchangeRate: {
    pair: string;
    latestRate: number | null;
    latestDate: string | null;
    momChange: number | null;
  };
  weightByCommodityId: Map<string, number>;
}

// --- Public API --------------------------------------------------------------

export interface GetCommoditiesResult {
  source: DataSource;
  commodities: CommoditySummary[];
}

/** All commodities with latest price + risk, optionally weighted by business. */
export async function getCommodities(
  businessType?: BusinessType,
): Promise<GetCommoditiesResult> {
  const bundle = await loadBundle(businessType);
  const commodities = bundle.commodities.map((c) =>
    toSummary(c, bundle),
  );
  return { source: bundle.source, commodities };
}

/**
 * Commodities + per-commodity history + FX in a SINGLE load. Lets callers
 * (e.g. the dashboard) avoid re-querying commodity_prices a second time.
 */
export interface CommodityBundleResult {
  source: DataSource;
  commodities: CommoditySummary[];
  historyById: Map<string, PricePoint[]>;
  exchangeRate: {
    pair: string;
    latestRate: number | null;
    latestDate: string | null;
    momChange: number | null;
  };
}

export async function getCommodityBundle(
  businessType?: BusinessType,
  opts?: { forceLive?: boolean },
): Promise<CommodityBundleResult> {
  const bundle = await loadBundle(businessType, opts);
  const commodities = bundle.commodities.map((c) => toSummary(c, bundle));

  const historyById = new Map<string, PricePoint[]>();
  for (const [id, series] of bundle.pricesByCommodity) {
    historyById.set(
      id,
      series.map((p) => ({
        date: p.price_date,
        value: p.value,
        momChange: p.mom_change,
        yoyChange: p.yoy_change,
      })),
    );
  }

  return {
    source: bundle.source,
    commodities,
    historyById,
    exchangeRate: bundle.exchangeRate,
  };
}

/** One commodity (by slug or id) with full history + risk. */
export async function getCommodityDetail(
  idOrSlug: string,
  businessType?: BusinessType,
): Promise<{ source: DataSource; detail: CommodityDetail } | null> {
  const bundle = await loadBundle(businessType);
  const commodity = bundle.commodities.find(
    (c) => c.slug === idOrSlug || c.id === idOrSlug,
  );
  if (!commodity) return null;

  const summary = toSummary(commodity, bundle);
  const series = bundle.pricesByCommodity.get(commodity.id) ?? [];
  const history: PricePoint[] = series.map((p) => ({
    date: p.price_date,
    value: p.value,
    momChange: p.mom_change,
    yoyChange: p.yoy_change,
  }));

  return {
    source: bundle.source,
    detail: { ...summary, description: commodity.description, history },
  };
}

// --- Risk wiring -------------------------------------------------------------

function toSummary(c: CommodityRow, bundle: RawBundle): CommoditySummary {
  const series = bundle.pricesByCommodity.get(c.id) ?? [];
  const latest = series.at(-1) ?? null;
  const values = series.map((p) => p.value);

  const risk: RiskResult = calculateRiskFromSeries({
    values,
    fxMomChange: bundle.fxMomChange,
    businessWeight: bundle.weightByCommodityId.get(c.id) ?? 1,
    momChange: latest?.mom_change ?? null,
    yoyChange: latest?.yoy_change ?? null,
  });

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    category: c.category,
    unit: c.unit,
    source: c.source,
    latestValue: latest?.value ?? null,
    latestDate: latest?.price_date ?? null,
    momChange: latest?.mom_change ?? null,
    yoyChange: latest?.yoy_change ?? null,
    riskLevel: risk.level,
    riskScore: risk.score,
    recommendation: risk.recommendation,
  };
}

// --- Loading: Supabase first, mock fallback ----------------------------------

async function loadBundle(
  businessType?: BusinessType,
  opts?: { forceLive?: boolean },
): Promise<RawBundle> {
  // Demo mode forces mock data even when Supabase is configured — unless the
  // caller explicitly wants live data (e.g. when persisting a real insight).
  if (!opts?.forceLive && (await isDemoMode())) {
    return buildFromMock(businessType);
  }
  const fromDb = await tryLoadFromSupabase(businessType);
  return fromDb ?? buildFromMock(businessType);
}

async function tryLoadFromSupabase(
  businessType?: BusinessType,
): Promise<RawBundle | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const [{ data: commodities }, { data: prices }, { data: fx }] =
      await Promise.all([
        supabase.from("commodities").select("*"),
        supabase
          .from("commodity_prices")
          .select("*")
          .order("price_date", { ascending: true }),
        supabase
          .from("exchange_rates")
          .select("*")
          .eq("pair", "USD/IDR")
          .order("rate_date", { ascending: true }),
      ]);

    if (!commodities?.length || !prices?.length) return null;

    let weights: Map<string, number> = new Map();
    if (businessType) {
      const { data: w } = await supabase
        .from("business_commodity_weights")
        .select("commodity_id, weight")
        .eq("business_type", businessType);
      const wRows = (w ?? []) as Array<{ commodity_id: string; weight: number }>;
      weights = new Map(wRows.map((r) => [r.commodity_id, r.weight]));
    }

    return assemble(
      commodities as CommodityRow[],
      prices as CommodityPriceRow[],
      (fx ?? []) as ExchangeRateRow[],
      weights,
      "supabase",
    );
  } catch {
    return null;
  }
}

function buildFromMock(businessType?: BusinessType): RawBundle {
  const commodities = getMockCommodities();
  const prices = getMockPrices();
  const fx = getMockExchangeRates().map((r) => ({
    rate_date: r.rate_date,
    pair: r.pair,
    rate: r.rate,
  }));

  // Mock business weights mirror seed.sql for realistic personalization.
  const weights = businessType
    ? mockWeights(commodities, businessType)
    : new Map<string, number>();

  return assemble(
    commodities,
    prices,
    fx as ExchangeRateRow[],
    weights,
    "mock",
  );
}

// --- Shared assembly ---------------------------------------------------------

function assemble(
  commodities: CommodityRow[],
  prices: CommodityPriceRow[],
  fx: Array<{ rate_date: string; pair: string; rate: number }>,
  weightByCommodityId: Map<string, number>,
  source: DataSource,
): RawBundle {
  const pricesByCommodity = new Map<string, CommodityPriceRow[]>();
  for (const p of prices) {
    const arr = pricesByCommodity.get(p.commodity_id) ?? [];
    arr.push(p);
    pricesByCommodity.set(p.commodity_id, arr);
  }
  for (const arr of pricesByCommodity.values()) {
    arr.sort((a, b) => a.price_date.localeCompare(b.price_date));
  }

  const fxSorted = [...fx].sort((a, b) =>
    a.rate_date.localeCompare(b.rate_date),
  );
  const fxLatest = fxSorted.at(-1) ?? null;
  const fxPrev = fxSorted.at(-2) ?? null;
  const fxMomChange =
    fxLatest && fxPrev && fxPrev.rate !== 0
      ? fxLatest.rate / fxPrev.rate - 1
      : null;

  return {
    source,
    commodities,
    pricesByCommodity,
    fxMomChange,
    exchangeRate: {
      pair: "USD/IDR",
      latestRate: fxLatest?.rate ?? null,
      latestDate: fxLatest?.rate_date ?? null,
      momChange: fxMomChange,
    },
    weightByCommodityId,
  };
}

// Mirror of seed.sql weights, keyed by slug -> applied to mock commodity ids.
const MOCK_WEIGHTS: Record<BusinessType, Record<string, number>> = {
  bakery: {
    wheat: 0.9, sugar: 0.7, dairy: 0.55, vegetable_oil: 0.5,
    cocoa: 0.4, crude_oil: 0.2, coffee: 0.1,
  },
  coffee_shop: {
    coffee: 0.95, dairy: 0.8, sugar: 0.55, cocoa: 0.45,
    crude_oil: 0.2, wheat: 0.25, vegetable_oil: 0.15,
  },
  restaurant: {
    vegetable_oil: 0.8, wheat: 0.55, sugar: 0.45, dairy: 0.45,
    crude_oil: 0.35, coffee: 0.2, cocoa: 0.15,
  },
};

function mockWeights(
  commodities: CommodityRow[],
  businessType: BusinessType,
): Map<string, number> {
  const bySlug = MOCK_WEIGHTS[businessType];
  return new Map(
    commodities.map((c) => [c.id, bySlug[c.slug] ?? 0.5]),
  );
}
