// =============================================================================
// SupplyWatch AI — Risk engine unit tests (Phase 5)
//
// Lightweight, dependency-free assertions runnable via: npm run test:risk
// Proves the formula behaves correctly and prints example input/output.
// =============================================================================

import {
  calculateRiskScore,
  calculateMomChange,
  calculateYoyChange,
  calculateVolatility,
  getRiskLevel,
  normalizeScore,
  generateRecommendation,
} from "@/lib/risk/calculate-risk";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function approx(a: number, b: number, eps = 0.0001) {
  return Math.abs(a - b) <= eps;
}

console.log("\n# calculateMomChange / calculateYoyChange");
{
  const v = [100, 110]; // +10%
  assert("MoM of [100,110] = 0.10", approx(calculateMomChange(v)!, 0.1));
  assert("MoM of single point = null", calculateMomChange([100]) === null);

  const series13 = Array.from({ length: 13 }, (_, i) => 100 + i); // 100..112
  assert(
    "YoY across 13 pts = 112/100-1 = 0.12",
    approx(calculateYoyChange(series13)!, 0.12),
  );
  assert("YoY with 12 pts = null", calculateYoyChange(series13.slice(0, 12)) === null);
}

console.log("\n# calculateVolatility");
{
  const flat = [100, 100, 100, 100, 100];
  assert("flat series -> 0 volatility", calculateVolatility(flat) === 0);

  const wobbly = [100, 110, 99, 112, 98, 115];
  const vol = calculateVolatility(wobbly);
  assert("wobbly series -> >0 volatility", vol !== null && vol > 0, `vol=${vol}`);
  assert("too-short series -> null", calculateVolatility([100, 101]) === null);
}

console.log("\n# normalizeScore (0–100 sub-scale)");
{
  assert("0 ratio -> 0", normalizeScore(0, 0.15) === 0);
  assert("at saturation -> 100", normalizeScore(0.15, 0.15) === 100);
  assert("above saturation clamps to 100", normalizeScore(0.5, 0.15) === 100);
  assert("half saturation -> 50", normalizeScore(0.075, 0.15) === 50);
  assert("negative uses magnitude", normalizeScore(-0.15, 0.15) === 100);
  assert("null -> 0", normalizeScore(null, 0.15) === 0);
}

console.log("\n# getRiskLevel thresholds");
{
  assert("30 -> Low", getRiskLevel(30) === "Low");
  assert("31 -> Medium", getRiskLevel(31) === "Medium");
  assert("65 -> Medium", getRiskLevel(65) === "Medium");
  assert("66 -> High", getRiskLevel(66) === "High");
}

console.log("\n# calculateRiskScore — score bounds & weighting");
{
  const stable = calculateRiskScore({
    momChange: 0,
    yoyChange: 0,
    fxMomChange: 0,
    volatility: 0,
  });
  assert("all-zero inputs -> score 0 (Low)", stable.score === 0 && stable.level === "Low");

  const extreme = calculateRiskScore({
    momChange: 0.5,
    yoyChange: 0.8,
    fxMomChange: 0.2,
    volatility: 0.3,
  });
  assert("extreme inputs -> score 100 (High)", extreme.score === 100, `score=${extreme.score}`);

  const full = calculateRiskScore({
    momChange: 0.1,
    yoyChange: 0.2,
    fxMomChange: 0.03,
    volatility: 0.05,
    businessWeight: 1,
  });
  const half = calculateRiskScore({
    momChange: 0.1,
    yoyChange: 0.2,
    fxMomChange: 0.03,
    volatility: 0.05,
    businessWeight: 0.5,
  });
  assert(
    "business weight 0.5 halves the score",
    approx(half.score, Math.round(full.breakdown.baseScore * 0.5), 1),
    `full=${full.score} half=${half.score}`,
  );
}

console.log("\n# generateRecommendation rules");
{
  assert(
    "price down -> bertahap",
    generateRecommendation("High", -0.05).includes("bertahap"),
  );
  assert(
    "High + up -> restock lebih awal",
    generateRecommendation("High", 0.05).includes("restock lebih awal"),
  );
  assert(
    "Medium + up -> monitor supplier",
    generateRecommendation("Medium", 0.05).includes("Monitor supplier"),
  );
  assert(
    "Low -> belum perlu aksi besar",
    generateRecommendation("Low", 0.01).includes("Belum perlu aksi besar"),
  );
}

console.log("\n# Example input -> output (Wheat for a Bakery)");
{
  const result = calculateRiskScore({
    momChange: 0.023, // +2.3% MoM
    yoyChange: 0.027, // +2.7% YoY
    fxMomChange: 0.012, // rupiah -1.2%
    volatility: 0.041, // 4.1% stddev
    businessWeight: 0.9, // wheat is critical for bakery
  });
  console.log(JSON.stringify(result, null, 2));
  assert("example produces a valid level", ["Low", "Medium", "High"].includes(result.level));
  assert("example score within 0..100", result.score >= 0 && result.score <= 100);
}

console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
