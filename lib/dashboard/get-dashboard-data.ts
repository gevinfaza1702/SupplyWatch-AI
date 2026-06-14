// =============================================================================
// SupplyWatch AI — Dashboard data layer (Phase 3, upgraded in Phase 5)
//
// Commodity summaries + risk now come from the shared commodity layer
// (lib/commodities/get-commodities.ts), which applies the full Risk Engine.
// This module adds the dashboard-specific aggregation: FX card, featured chart,
// and the weekly summary. Falls back to mock automatically via the layer below.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { getMockExchangeRates, getMockPrices, getMockCommodities } from "@/lib/data-sources/mock-source";
import { getCommodities, type DataSource } from "@/lib/commodities/get-commodities";
import type {
  BusinessType,
  CommodityPriceRow,
  ExchangeRateRow,
  RiskLevel,
} from "@/types/database";
import type { CommoditySummary, PricePoint } from "@/types/commodity";

export interface DashboardData {
  source: DataSource;
  generatedAt: string;
  commodities: CommoditySummary[];
  topRisky: CommoditySummary[];
  exchangeRate: {
    pair: string;
    latestRate: number | null;
    latestDate: string | null;
    momChange: number | null;
  };
  featured: {
    name: string;
    unit: string | null;
    history: PricePoint[];
  } | null;
  summary: {
    weeklyRiskLevel: RiskLevel;
    riskiestCommodity: string | null;
    mainRecommendation: string | null;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

const RISK_ORDER: Record<RiskLevel, number> = { High: 3, Medium: 2, Low: 1 };

export async function getDashboardData(
  businessType?: BusinessType,
): Promise<DashboardData> {
  // Risk-scored commodities (engine-backed, with mock fallback inside).
  const { source, commodities } = await getCommodities(businessType);

  // FX + featured history come from the same source the layer used.
  const { fx, historyById } = await loadAux(source);

  const fxSorted = [...fx].sort((a, b) =>
    a.rate_date.localeCompare(b.rate_date),
  );
  const fxLatest = fxSorted.at(-1) ?? null;
  const fxPrev = fxSorted.at(-2) ?? null;
  const fxMom =
    fxLatest && fxPrev && fxPrev.rate !== 0
      ? fxLatest.rate / fxPrev.rate - 1
      : null;

  const ranked = [...commodities].sort(
    (a, b) =>
      RISK_ORDER[b.riskLevel ?? "Low"] - RISK_ORDER[a.riskLevel ?? "Low"] ||
      (b.riskScore ?? 0) - (a.riskScore ?? 0),
  );
  const riskiest = ranked[0] ?? null;

  const highCount = commodities.filter((c) => c.riskLevel === "High").length;
  const mediumCount = commodities.filter((c) => c.riskLevel === "Medium").length;
  const lowCount = commodities.filter((c) => c.riskLevel === "Low").length;
  const weeklyRiskLevel: RiskLevel =
    highCount > 0 ? "High" : mediumCount > 0 ? "Medium" : "Low";

  const featuredHistory = riskiest ? historyById.get(riskiest.id) ?? [] : [];
  const featured = riskiest
    ? { name: riskiest.name, unit: riskiest.unit, history: featuredHistory }
    : null;

  return {
    source,
    generatedAt: new Date().toISOString(),
    commodities,
    topRisky: ranked.slice(0, 5),
    exchangeRate: {
      pair: "USD/IDR",
      latestRate: fxLatest?.rate ?? null,
      latestDate: fxLatest?.rate_date ?? null,
      momChange: fxMom,
    },
    featured,
    summary: {
      weeklyRiskLevel,
      riskiestCommodity: riskiest?.name ?? null,
      mainRecommendation: riskiest?.recommendation ?? null,
      highCount,
      mediumCount,
      lowCount,
    },
  };
}

/** Load FX series + per-commodity history, matching the chosen data source. */
async function loadAux(source: DataSource): Promise<{
  fx: Array<{ rate_date: string; pair: string; rate: number }>;
  historyById: Map<string, PricePoint[]>;
}> {
  if (source === "mock") {
    const historyById = buildHistoryFromMock();
    return {
      fx: getMockExchangeRates().map((r) => ({
        rate_date: r.rate_date,
        pair: r.pair,
        rate: r.rate,
      })),
      historyById,
    };
  }

  // Supabase path
  const supabase = await createClient();
  const [{ data: prices }, { data: fx }] = await Promise.all([
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

  const priceRows = (prices ?? []) as CommodityPriceRow[];
  const fxRows = (fx ?? []) as ExchangeRateRow[];

  const historyById = new Map<string, PricePoint[]>();
  for (const p of priceRows) {
    const arr = historyById.get(p.commodity_id) ?? [];
    arr.push({
      date: p.price_date,
      value: p.value,
      momChange: p.mom_change,
      yoyChange: p.yoy_change,
    });
    historyById.set(p.commodity_id, arr);
  }

  return {
    fx: fxRows.map((r) => ({
      rate_date: r.rate_date,
      pair: r.pair,
      rate: r.rate,
    })),
    historyById,
  };
}

function buildHistoryFromMock(): Map<string, PricePoint[]> {
  const commodities = getMockCommodities();
  const ids = new Set(commodities.map((c) => c.id));
  const map = new Map<string, PricePoint[]>();
  for (const p of getMockPrices()) {
    if (!ids.has(p.commodity_id)) continue;
    const arr = map.get(p.commodity_id) ?? [];
    arr.push({
      date: p.price_date,
      value: p.value,
      momChange: p.mom_change,
      yoyChange: p.yoy_change,
    });
    map.set(p.commodity_id, arr);
  }
  return map;
}
