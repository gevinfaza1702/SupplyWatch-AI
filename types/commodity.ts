// =============================================================================
// SupplyWatch AI — Commodity domain types (Phase 2)
//
// View-model types used by the dashboard, commodity pages, and APIs. These are
// derived/aggregated shapes built on top of the raw DB rows in database.ts.
// =============================================================================

import type {
  BusinessType,
  CommodityRow,
  CommodityPriceRow,
  RiskLevel,
} from "./database";

/** A single point on a commodity price chart. */
export interface PricePoint {
  date: string; // ISO date
  value: number;
  momChange: number | null; // ratio
  yoyChange: number | null; // ratio
}

/** Latest snapshot of a commodity, ready to render in a card or table row. */
export interface CommoditySummary {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  unit: string | null;
  source: string | null;
  latestValue: number | null;
  latestDate: string | null;
  momChange: number | null; // ratio, latest point
  yoyChange: number | null; // ratio, latest point
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  recommendation: string | null;
}

/** Full commodity detail with its historical series. */
export interface CommodityDetail extends CommoditySummary {
  description: string | null;
  history: PricePoint[];
}

/** USD/IDR (or any pair) snapshot for summary cards. */
export interface ExchangeRateSummary {
  pair: string;
  latestRate: number | null;
  latestDate: string | null;
  momChange: number | null; // ratio vs. previous month
}

/** Inputs the Risk Engine (Phase 5) consumes per commodity. */
export interface RiskInput {
  momChange: number | null;
  yoyChange: number | null;
  fxMomChange: number | null;
  businessWeight: number; // 0..1
  volatilityScore: number; // 0..1, derived from last 6 months
}

/** Risk Engine output. */
export interface RiskResult {
  score: number; // 0..100
  level: RiskLevel;
  reason: string;
  recommendation: string;
}

/** Helper: re-export commonly paired raw types for convenience. */
export type { CommodityRow, CommodityPriceRow, BusinessType };
