// =============================================================================
// SupplyWatch AI — Dashboard data layer (Phase 3, upgraded in Phase 5 & 9)
//
// Commodity summaries + risk + per-commodity history + FX all come from ONE
// call to getCommodityBundle() (engine-backed, with mock fallback). This module
// only adds dashboard-specific aggregation: featured chart + weekly summary.
// No second query to commodity_prices (was a double-fetch before Phase 9).
// =============================================================================

import { getCommodityBundle, type DataSource } from "@/lib/commodities/get-commodities";
import type { BusinessType, RiskLevel } from "@/types/database";
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
  opts?: { forceLive?: boolean },
): Promise<DashboardData> {
  const { source, commodities, historyById, exchangeRate } =
    await getCommodityBundle(businessType, opts);

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
    exchangeRate,
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
