// =============================================================================
// SupplyWatch AI — Cost Simulator domain types (Phase 2)
// =============================================================================

import type { IngredientMix } from "./database";

export type SimulatorStatus =
  | "Aman"
  | "Perlu Monitor"
  | "Perlu Evaluasi Harga";

export type SimulatorIngredientSlug =
  | "sugar"
  | "wheat"
  | "coffee"
  | "dairy"
  | "vegetable_oil";

/** Raw user input from the simulator form. */
export interface SimulatorInput {
  productName: string;
  sellingPrice: number;
  currentCost: number;
  targetMargin: number; // percent, e.g. 30
  /**
   * Share of current cost attributable to each ingredient, as ratios.
   * e.g. { sugar: 0.2, wheat: 0.6, coffee: 0, dairy: 0.1, vegetable_oil: 0.1 }
   * Shares should sum to <= 1; the remainder is treated as non-commodity cost.
   */
  ingredientMix: IngredientMix;
}

/** Deterministic calculation output (before AI explanation). */
export interface SimulatorCalculation {
  currentMargin: number; // percent
  estimatedNewCost: number;
  estimatedNewMargin: number; // percent
  /** Suggested price to restore the target margin. */
  recommendedPrice: number;
  needsPriceIncrease: boolean;
  status: SimulatorStatus;
  /** Per-ingredient cost-increase contribution, for display. */
  breakdown: Array<{
    slug: SimulatorIngredientSlug;
    name: string;
    share: number; // ratio of cost
    appliedChange: number; // ratio of price change used
    addedCost: number; // currency
    riskLevel: "Low" | "Medium" | "High" | null;
  }>;
}

/** The JSON contract the AI returns for the simulator explanation (Phase 7). */
export interface SimulatorAiPayload {
  ai_explanation: string;
  margin_status: string;
  pricing_recommendation: string;
  operational_suggestions: string[];
  customer_communication_tip: string;
}

/** Combined result saved to simulation_results and rendered in the UI. */
export interface SimulatorResultView extends SimulatorCalculation {
  productName: string;
  sellingPrice: number;
  currentCost: number;
  targetMargin: number;
  ingredientMix: IngredientMix;
  ai?: SimulatorAiPayload;
  aiExplanationText?: string; // fallback plain text if JSON parse fails
}
