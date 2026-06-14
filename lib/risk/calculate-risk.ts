// =============================================================================
// SupplyWatch AI — Risk Scoring Engine (Phase 5)
//
// Turns commodity price movement + FX + volatility + business weight into a
// 0–100 risk score, a Low/Medium/High level, a human reason, and a rule-based
// recommendation. This is the full engine; it supersedes lib/risk/preview-risk.ts.
//
// IMPORTANT — units:
//   mom_change / yoy_change / fx_mom_change are RATIOS (0.08 = +8%), matching
//   commodity_prices.mom_change in the DB. Volatility is also a ratio (stddev of
//   monthly returns). Each contribution is normalized onto a 0–100 sub-scale
//   (see normalizeScore) BEFORE the weighted blend, so the final score lands in
//   a meaningful 0–100 range instead of a fraction.
//
//   business_commodity_weight is 0..1 and scales the result: a commodity that
//   barely matters to a business can't dominate its risk picture.
// =============================================================================

import type { RiskLevel } from "@/types/database";

// --- Tunable constants -------------------------------------------------------

/** Formula weights (must sum to 1.0). */
export const RISK_WEIGHTS = {
  mom: 0.35,
  yoy: 0.2,
  fx: 0.25,
  volatility: 0.2,
} as const;

/**
 * A move of this magnitude (ratio) maps to a full 100 on its sub-scale.
 * e.g. SATURATION.mom = 0.15 means a +15% MoM move already maxes the MoM term.
 * Calibrated so typical commodity swings produce a sensible spread.
 */
const SATURATION = {
  mom: 0.15, // 15% month-over-month
  yoy: 0.4, // 40% year-over-year
  fx: 0.06, // 6% USD/IDR monthly move
  volatility: 0.1, // 10% stddev of monthly returns
} as const;

/** Risk level thresholds on the 0–100 scale. */
const THRESHOLDS = { lowMax: 30, mediumMax: 65 } as const;

// --- Input / output shapes ---------------------------------------------------

export interface RiskInput {
  /** Month-over-month change, ratio (0.08 = +8%). May be null. */
  momChange: number | null;
  /** Year-over-year change, ratio. May be null when <12 months of data. */
  yoyChange: number | null;
  /** USD/IDR month-over-month change, ratio. May be null. */
  fxMomChange: number | null;
  /** Volatility (ratio) from the last 6 months. May be null. */
  volatility: number | null;
  /** Business commodity weight, 0..1. Defaults to 1 (no business context). */
  businessWeight?: number;
}

export interface RiskResult {
  score: number; // 0..100, rounded
  level: RiskLevel;
  reason: string;
  recommendation: string;
  /** Per-term breakdown (0..100 each) for transparency / debugging. */
  breakdown: {
    momTerm: number;
    yoyTerm: number;
    fxTerm: number;
    volatilityTerm: number;
    baseScore: number;
    weight: number;
  };
}

// --- Public helpers ----------------------------------------------------------

/**
 * Calculate MoM change from a chronologically-sorted value series.
 * Returns the change between the last two points, as a ratio, or null.
 */
export function calculateMomChange(values: number[]): number | null {
  if (values.length < 2) return null;
  const prev = values[values.length - 2];
  const curr = values[values.length - 1];
  if (!prev) return null;
  return round4(curr / prev - 1);
}

/**
 * Calculate YoY change: latest value vs the value 12 points earlier, as a ratio.
 * Returns null when fewer than 13 points are available.
 */
export function calculateYoyChange(values: number[]): number | null {
  if (values.length < 13) return null;
  const curr = values[values.length - 1];
  const yearAgo = values[values.length - 13];
  if (!yearAgo) return null;
  return round4(curr / yearAgo - 1);
}

/**
 * Volatility from the last 6 months: population standard deviation of monthly
 * returns over the window. Returns a ratio, or null if not enough data.
 *
 * Needs at least 4 points (=> 3 returns) to be meaningful; uses up to the last
 * 7 points (=> 6 monthly returns).
 */
export function calculateVolatility(values: number[]): number | null {
  if (values.length < 4) return null;
  const window = values.slice(-7); // up to 6 returns
  const returns: number[] = [];
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1];
    if (!prev) continue;
    returns.push(window[i] / prev - 1);
  }
  if (returns.length < 3) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return round4(Math.sqrt(variance));
}

/**
 * Normalize a raw ratio onto a 0–100 sub-scale relative to a saturation point.
 * Linear, clamped: 0 -> 0, |ratio| >= saturation -> 100.
 */
export function normalizeScore(ratio: number | null, saturation: number): number {
  if (ratio == null || saturation <= 0) return 0;
  const pct = (Math.abs(ratio) / saturation) * 100;
  return clamp(pct, 0, 100);
}

/** Map a 0–100 score to a risk level. */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= THRESHOLDS.lowMax) return "Low";
  if (score <= THRESHOLDS.mediumMax) return "Medium";
  return "High";
}

/**
 * The core score. Each term is normalized to 0–100, blended by RISK_WEIGHTS,
 * then scaled by the business weight (0..1) and clamped to 0–100.
 */
export function calculateRiskScore(input: RiskInput): RiskResult {
  const weight = clamp(input.businessWeight ?? 1, 0, 1);

  const momTerm = normalizeScore(input.momChange, SATURATION.mom);
  const yoyTerm = normalizeScore(input.yoyChange, SATURATION.yoy);
  const fxTerm = normalizeScore(input.fxMomChange, SATURATION.fx);
  const volatilityTerm = normalizeScore(input.volatility, SATURATION.volatility);

  const baseScore =
    momTerm * RISK_WEIGHTS.mom +
    yoyTerm * RISK_WEIGHTS.yoy +
    fxTerm * RISK_WEIGHTS.fx +
    volatilityTerm * RISK_WEIGHTS.volatility;

  const score = Math.round(clamp(baseScore * weight, 0, 100));
  const level = getRiskLevel(score);

  return {
    score,
    level,
    reason: generateReason(input, level),
    recommendation: generateRecommendation(level, input.momChange),
    breakdown: {
      momTerm: round2(momTerm),
      yoyTerm: round2(yoyTerm),
      fxTerm: round2(fxTerm),
      volatilityTerm: round2(volatilityTerm),
      baseScore: round2(baseScore),
      weight,
    },
  };
}

/** Human-readable explanation of what drove the score (Bahasa Indonesia). */
export function generateReason(input: RiskInput, level: RiskLevel): string {
  const priceUp = (input.momChange ?? 0) > 0;
  const parts: string[] = [];

  if (input.momChange != null && Math.abs(input.momChange) >= 0.005) {
    parts.push(`harga ${priceUp ? "naik" : "turun"} ${pct(input.momChange)} (MoM)`);
  }
  if (input.yoyChange != null && Math.abs(input.yoyChange) >= 0.01) {
    parts.push(`${pct(input.yoyChange)} (YoY)`);
  }
  if (input.fxMomChange != null && Math.abs(input.fxMomChange) >= 0.005) {
    const dir = input.fxMomChange > 0 ? "melemah" : "menguat";
    parts.push(`rupiah ${dir} ${pct(input.fxMomChange)} terhadap USD`);
  }
  if (input.volatility != null && input.volatility >= 0.03) {
    parts.push(`volatilitas ${pct(input.volatility)} dalam 6 bulan terakhir`);
  }

  if (parts.length === 0) {
    return "Pergerakan harga, kurs, dan volatilitas relatif stabil.";
  }

  const levelText =
    level === "High" ? "tinggi" : level === "Medium" ? "sedang" : "rendah";
  return `Risiko ${levelText} didorong oleh ${joinId(parts)}.`;
}

/** Rule-based recommendation per the Phase 0 rules (Bahasa Indonesia). */
export function generateRecommendation(
  level: RiskLevel,
  momChange: number | null,
): string {
  const priceUp = (momChange ?? 0) > 0;

  if (!priceUp && (momChange ?? 0) < -0.005) {
    return "Harga sedang turun — pertimbangkan pembelian bertahap, jangan overstock.";
  }
  if (level === "High" && priceUp) {
    return "Pertimbangkan restock lebih awal dan evaluasi harga jual.";
  }
  if (level === "Medium" && priceUp) {
    return "Monitor supplier dan cek margin produk terkait.";
  }
  if (level === "Low") {
    return "Belum perlu aksi besar, cukup pantau tren.";
  }
  return "Pantau pergerakan harga dan kurs secara berkala.";
}

// --- Convenience: build inputs straight from a price series ------------------

/**
 * Derive a full RiskResult from a sorted value series + FX + business weight.
 * Convenient for API routes that already have a commodity's history.
 */
export function calculateRiskFromSeries(args: {
  values: number[]; // ascending by date
  fxMomChange: number | null;
  businessWeight?: number;
  /** Pre-computed MoM/YoY (e.g. from DB); falls back to deriving from values. */
  momChange?: number | null;
  yoyChange?: number | null;
}): RiskResult {
  const momChange =
    args.momChange ?? calculateMomChange(args.values);
  const yoyChange =
    args.yoyChange ?? calculateYoyChange(args.values);
  const volatility = calculateVolatility(args.values);

  return calculateRiskScore({
    momChange,
    yoyChange,
    fxMomChange: args.fxMomChange,
    volatility,
    businessWeight: args.businessWeight,
  });
}

// --- Internals ---------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
function pct(ratio: number): string {
  const p = ratio * 100;
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}
function joinId(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} dan ${parts[parts.length - 1]}`;
}
