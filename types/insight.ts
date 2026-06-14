// =============================================================================
// SupplyWatch AI — AI Insight domain types (Phase 2)
//
// The structured shape the AI must return for impact analysis, plus the
// view-model used by the insights UI. The AI prompt (Phase 6) targets
// `AiInsightPayload`; the safe JSON parser validates against it.
// =============================================================================

import type { ActionPlanItem, BusinessType, RiskLevel } from "./database";

/**
 * The JSON contract the AI returns for impact analysis.
 * Keep in sync with lib/ai/prompts.ts (Phase 6).
 */
export interface AiInsightPayload {
  summary: string;
  risk_level: RiskLevel;
  impact_analysis: string;
  main_drivers: string[];
  recommendation: string;
  action_plan: ActionPlanItem[];
  confidence_score: number; // 0..100
  disclaimer: string;
}

/** Inputs gathered before calling the AI (also stored as input_snapshot). */
export interface InsightGenerationInput {
  businessType: BusinessType;
  location?: string | null;
  targetMargin?: number | null;
  monthlyBudget?: number | null;
  /** Per-commodity data points the AI should reason over. */
  commodities: Array<{
    name: string;
    slug: string;
    latestValue: number | null;
    momChange: number | null;
    yoyChange: number | null;
    riskLevel: RiskLevel | null;
    weight: number;
  }>;
  exchangeRate: {
    pair: string;
    latestRate: number | null;
    momChange: number | null;
  };
}

/** View-model for the /insights page (maps from AiInsightRow). */
export interface InsightView {
  id: string;
  businessType: string | null;
  period: string | null;
  summary: string | null;
  impactAnalysis: string | null;
  mainDrivers: string[];
  recommendation: string | null;
  actionPlan: ActionPlanItem[];
  riskLevel: RiskLevel | null;
  confidenceScore: number | null;
  disclaimer: string | null;
  createdAt: string;
  /** True when the AI response could not be parsed and we fell back to text. */
  isFallback?: boolean;
}
