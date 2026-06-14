// =============================================================================
// SupplyWatch AI — Cost simulator test case (Phase 7)
//
// Lightweight deterministic test runnable via: npm run test:simulator
// =============================================================================

import { calculateCostImpact } from "@/lib/simulator/calculate-cost-impact";
import type { SimulatorInput } from "@/types/simulator";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ok ${name}`);
  } else {
    failed++;
    console.error(`  fail ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function approx(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

console.log("\n# Cost Impact Simulator example");

const input: SimulatorInput = {
  productName: "Roti manis",
  sellingPrice: 15000,
  currentCost: 9000,
  targetMargin: 35,
  ingredientMix: {
    sugar: 0.1,
    wheat: 0.45,
    coffee: 0,
    dairy: 0.1,
    vegetable_oil: 0.05,
  },
};

const result = calculateCostImpact(input, {
  sugar: { name: "Gula (Sugar)", priceChange: 0.02, riskLevel: "Low" },
  wheat: {
    name: "Gandum (Wheat/Cereal)",
    priceChange: 0.03,
    riskLevel: "Medium",
  },
  coffee: { name: "Kopi (Coffee)", priceChange: 0.1, riskLevel: "High" },
  dairy: { name: "Susu/Dairy", priceChange: 0.01, riskLevel: "Low" },
  vegetable_oil: {
    name: "Minyak Nabati (Veg Oil)",
    priceChange: 0.04,
    riskLevel: "Medium",
  },
});

console.log(JSON.stringify(result, null, 2));

assert("current margin is 40%", approx(result.currentMargin, 40));
assert("estimated new cost is Rp9.167", result.estimatedNewCost === 9167);
assert("estimated new margin is 38.89%", approx(result.estimatedNewMargin, 38.89));
assert("recommended price is Rp14.103", result.recommendedPrice === 14103);
assert("status is Perlu Monitor", result.status === "Perlu Monitor");
assert("breakdown has 5 ingredients", result.breakdown.length === 5);

console.log(`\n${failed === 0 ? "ok" : "fail"} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
