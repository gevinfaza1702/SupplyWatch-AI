import type { RiskLevel } from "@/types/database";
import type {
  SimulatorCalculation,
  SimulatorIngredientSlug,
  SimulatorInput,
  SimulatorStatus,
} from "@/types/simulator";

export const SIMULATOR_INGREDIENTS: Array<{
  slug: SimulatorIngredientSlug;
  label: string;
}> = [
  { slug: "sugar", label: "Sugar" },
  { slug: "wheat", label: "Wheat/Cereal" },
  { slug: "coffee", label: "Coffee" },
  { slug: "dairy", label: "Dairy" },
  { slug: "vegetable_oil", label: "Vegetable Oil" },
];

export type CommodityImpactMap = Partial<
  Record<
    SimulatorIngredientSlug,
    {
      name: string;
      priceChange: number | null;
      riskLevel: RiskLevel | null;
    }
  >
>;

export function calculateCostImpact(
  input: SimulatorInput,
  commodityImpacts: CommodityImpactMap,
): SimulatorCalculation {
  const sellingPrice = Math.max(0, input.sellingPrice);
  const currentCost = Math.max(0, input.currentCost);
  const targetMargin = clamp(input.targetMargin, 0, 95);
  const normalizedMix = normalizeMix(input.ingredientMix);

  const breakdown = SIMULATOR_INGREDIENTS.map(({ slug, label }) => {
    const share = normalizedMix[slug] ?? 0;
    const impact = commodityImpacts[slug];
    const appliedChange = impact?.priceChange ?? 0;
    return {
      slug,
      name: impact?.name ?? label,
      share,
      appliedChange,
      addedCost: roundCurrency(currentCost * share * appliedChange),
      riskLevel: impact?.riskLevel ?? null,
    };
  });

  const addedCost = breakdown.reduce((sum, item) => sum + item.addedCost, 0);
  const estimatedNewCost = roundCurrency(Math.max(0, currentCost + addedCost));
  const currentMargin = calculateMargin(sellingPrice, currentCost);
  const estimatedNewMargin = calculateMargin(sellingPrice, estimatedNewCost);
  const recommendedPrice = roundCurrency(
    targetMargin >= 95
      ? estimatedNewCost
      : estimatedNewCost / (1 - targetMargin / 100),
  );
  const needsPriceIncrease = recommendedPrice > sellingPrice;

  return {
    currentMargin,
    estimatedNewCost,
    estimatedNewMargin,
    recommendedPrice,
    needsPriceIncrease,
    status: determineStatus({
      targetMargin,
      currentMargin,
      estimatedNewMargin,
      estimatedNewCost,
      currentCost,
      breakdown,
    }),
    breakdown,
  };
}

export function normalizeMix(
  mix: SimulatorInput["ingredientMix"],
): Record<SimulatorIngredientSlug, number> {
  const result = Object.fromEntries(
    SIMULATOR_INGREDIENTS.map(({ slug }) => [slug, clamp(mix[slug] ?? 0, 0, 1)]),
  ) as Record<SimulatorIngredientSlug, number>;

  const total = Object.values(result).reduce((sum, value) => sum + value, 0);
  if (total <= 1) return result;

  return Object.fromEntries(
    SIMULATOR_INGREDIENTS.map(({ slug }) => [slug, result[slug] / total]),
  ) as Record<SimulatorIngredientSlug, number>;
}

function determineStatus(args: {
  targetMargin: number;
  currentMargin: number;
  estimatedNewMargin: number;
  estimatedNewCost: number;
  currentCost: number;
  breakdown: SimulatorCalculation["breakdown"];
}): SimulatorStatus {
  const marginGap = args.targetMargin - args.estimatedNewMargin;
  const costIncrease =
    args.currentCost > 0
      ? args.estimatedNewCost / args.currentCost - 1
      : 0;
  const hasHighRiskDriver = args.breakdown.some(
    (item) => item.share > 0 && item.riskLevel === "High",
  );

  if (marginGap >= 2 || costIncrease >= 0.05 || hasHighRiskDriver) {
    return "Perlu Evaluasi Harga";
  }

  if (marginGap > 0 || costIncrease >= 0.015) {
    return "Perlu Monitor";
  }

  return "Aman";
}

function calculateMargin(sellingPrice: number, cost: number): number {
  if (sellingPrice <= 0) return 0;
  return round2(((sellingPrice - cost) / sellingPrice) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
}

function roundCurrency(value: number): number {
  return Math.round(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
