import type { AiInsightPayload, InsightGenerationInput } from "@/types/insight";
import type { BusinessType, RiskLevel } from "@/types/database";
import type {
  SimulatorAiPayload,
  SimulatorCalculation,
  SimulatorInput,
} from "@/types/simulator";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  bakery: "Toko roti",
  coffee_shop: "Kedai kopi",
  restaurant: "Restoran",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  Low: "rendah",
  Medium: "sedang",
  High: "tinggi",
};

const RISK_RANK: Record<RiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export function buildImpactAnalysisPrompt(
  input: InsightGenerationInput,
): string {
  const businessLabel = BUSINESS_TYPE_LABELS[input.businessType];

  return `
Anda adalah analis SupplyWatch AI untuk UMKM Indonesia.

Tugas:
Analisis dampak perubahan harga komoditas global dan kurs USD/IDR terhadap bisnis ${businessLabel}. Fokus pada keputusan praktis pemilik UMKM: restock, negosiasi supplier, evaluasi margin, dan penyesuaian harga jual.

Aturan jawaban:
- Gunakan Bahasa Indonesia yang jelas dan praktis.
- Jangan mengarang data di luar input.
- Jangan menyebut "sebagai AI".
- Output harus berupa JSON valid saja, tanpa markdown, tanpa code fence, tanpa komentar.
- Semua field wajib ada dan tidak boleh null.
- "risk_level" hanya boleh "Low", "Medium", atau "High".
- "confidence_score" angka 0 sampai 100.
- "action_plan" berisi 3 sampai 5 item, diprioritaskan untuk UMKM.

Skema JSON wajib:
{
  "summary": "1-2 kalimat ringkasan risiko biaya",
  "risk_level": "Low | Medium | High",
  "impact_analysis": "analisis dampak ke biaya bahan baku, margin, dan operasional",
  "main_drivers": ["driver utama 1", "driver utama 2", "driver utama 3"],
  "recommendation": "rekomendasi utama yang paling penting",
  "action_plan": [
    { "action": "aksi konkret", "priority": "Low | Medium | High", "reason": "alasan singkat" }
  ],
  "confidence_score": 0,
  "disclaimer": "Insight ini bersifat estimasi berbasis data historis dan bukan kepastian harga pasar."
}

Input data:
${JSON.stringify(input, null, 2)}
`.trim();
}

export function buildRuleBasedInsight(
  input: InsightGenerationInput,
): AiInsightPayload {
  const ranked = [...input.commodities].sort((a, b) => {
    const aLevel = a.riskLevel ?? "Low";
    const bLevel = b.riskLevel ?? "Low";
    const levelDiff = RISK_RANK[bLevel] - RISK_RANK[aLevel];
    if (levelDiff !== 0) return levelDiff;
    return Math.abs(b.momChange ?? 0) - Math.abs(a.momChange ?? 0);
  });

  const highCount = input.commodities.filter(
    (item) => item.riskLevel === "High",
  ).length;
  const mediumCount = input.commodities.filter(
    (item) => item.riskLevel === "Medium",
  ).length;
  const riskLevel: RiskLevel =
    highCount > 0 ? "High" : mediumCount > 0 ? "Medium" : "Low";

  const businessLabel = BUSINESS_TYPE_LABELS[input.businessType];
  const topDrivers = ranked.slice(0, 3);
  const driverNames = topDrivers.map((item) => item.name).join(", ");
  const fxText =
    input.exchangeRate.momChange == null
      ? "data kurs USD/IDR terbaru belum lengkap"
      : `kurs USD/IDR berubah ${formatPercent(input.exchangeRate.momChange)} MoM`;

  return {
    summary: `Risiko biaya bahan baku untuk ${businessLabel} saat ini berada di level ${RISK_LABELS[riskLevel]}. Fokus pemantauan utama ada pada ${driverNames || "komoditas utama"} dan ${fxText}.`,
    risk_level: riskLevel,
    impact_analysis: buildFallbackImpact(input, topDrivers, riskLevel),
    main_drivers: topDrivers.map(formatDriver),
    recommendation: buildFallbackRecommendation(riskLevel),
    action_plan: buildFallbackActionPlan(riskLevel),
    confidence_score: calculateFallbackConfidence(input),
    disclaimer:
      "Insight ini bersifat estimasi berbasis data historis dan bukan kepastian harga pasar.",
  };
}

export function buildSimulatorExplanationPrompt(args: {
  input: SimulatorInput;
  calculation: SimulatorCalculation;
}): string {
  return `
Anda adalah analis biaya untuk UMKM makanan/minuman di Indonesia.

Tugas:
Jelaskan hasil cost impact simulator untuk produk "${args.input.productName}".
Fokus pada dampak biaya bahan baku, margin, harga jual, dan saran operasional yang realistis.

Aturan jawaban:
- Gunakan Bahasa Indonesia.
- Jangan mengarang data di luar input.
- Jangan menyebut "sebagai AI".
- Output harus JSON valid saja, tanpa markdown atau komentar.
- Semua field wajib ada dan tidak boleh null.
- "operational_suggestions" berisi 3 sampai 5 saran konkret.

Skema JSON wajib:
{
  "ai_explanation": "penjelasan singkat dampak biaya dan margin",
  "margin_status": "Aman | Perlu Monitor | Perlu Evaluasi Harga",
  "pricing_recommendation": "rekomendasi harga jual yang praktis",
  "operational_suggestions": ["saran operasional 1", "saran operasional 2", "saran operasional 3"],
  "customer_communication_tip": "cara komunikasi ke pelanggan jika harga perlu disesuaikan"
}

Input:
${JSON.stringify(args, null, 2)}
`.trim();
}

export function buildRuleBasedSimulatorExplanation(args: {
  input: SimulatorInput;
  calculation: SimulatorCalculation;
}): SimulatorAiPayload {
  const topDrivers = [...args.calculation.breakdown]
    .filter((item) => item.share > 0)
    .sort((a, b) => b.addedCost - a.addedCost)
    .slice(0, 3);
  const driverText = topDrivers.length
    ? topDrivers
        .map((item) => `${item.name} (${formatPercent(item.appliedChange)})`)
        .join(", ")
    : "komposisi bahan utama";

  return {
    ai_explanation: `${args.input.productName} berada pada status ${args.calculation.status}. Estimasi biaya baru menjadi Rp${args.calculation.estimatedNewCost.toLocaleString("id-ID")} dan margin turun ke ${args.calculation.estimatedNewMargin.toFixed(1)}%, terutama dipengaruhi oleh ${driverText}.`,
    margin_status: args.calculation.status,
    pricing_recommendation:
      args.calculation.needsPriceIncrease
        ? `Pertimbangkan harga jual sekitar Rp${args.calculation.recommendedPrice.toLocaleString("id-ID")} agar target margin ${args.input.targetMargin}% tetap tercapai.`
        : "Harga jual saat ini masih cukup untuk menjaga target margin, tetapi tetap pantau perubahan harga bahan.",
    operational_suggestions: buildSimulatorSuggestions(args.calculation),
    customer_communication_tip:
      "Jika perlu menaikkan harga, jelaskan secara sederhana bahwa perubahan dilakukan untuk menjaga kualitas bahan dan porsi produk.",
  };
}

function buildFallbackImpact(
  input: InsightGenerationInput,
  drivers: InsightGenerationInput["commodities"],
  riskLevel: RiskLevel,
): string {
  const businessLabel = BUSINESS_TYPE_LABELS[input.businessType];
  const driverText = drivers.length
    ? drivers.map((item) => `${item.name} (${item.riskLevel ?? "Low"})`).join(", ")
    : "komoditas utama";
  const marginText =
    input.targetMargin == null
      ? "margin target belum diisi"
      : `margin target ${input.targetMargin}%`;

  if (riskLevel === "High") {
    return `${businessLabel} berpotensi mengalami tekanan biaya karena ${driverText}. Dengan ${marginText}, kenaikan harga bahan perlu segera dibandingkan dengan harga supplier dan harga jual produk agar margin tidak turun terlalu jauh.`;
  }
  if (riskLevel === "Medium") {
    return `${businessLabel} masih berada pada risiko sedang. ${driverText} perlu dipantau karena perubahan harga dapat mulai menekan biaya produksi, terutama jika stok menipis atau supplier menaikkan harga.`;
  }
  return `${businessLabel} relatif stabil saat ini. ${driverText} tetap perlu dipantau, tetapi belum ada sinyal kuat untuk perubahan harga jual atau restock besar.`;
}

function formatDriver(item: InsightGenerationInput["commodities"][number]): string {
  const parts = [`${item.name}: risiko ${RISK_LABELS[item.riskLevel ?? "Low"]}`];
  if (item.momChange != null) parts.push(`MoM ${formatPercent(item.momChange)}`);
  if (item.yoyChange != null) parts.push(`YoY ${formatPercent(item.yoyChange)}`);
  parts.push(`bobot bisnis ${Math.round(item.weight * 100)}%`);
  return parts.join(", ");
}

function buildFallbackRecommendation(riskLevel: RiskLevel): string {
  if (riskLevel === "High") {
    return "Prioritaskan cek stok dan harga supplier minggu ini, lalu evaluasi harga jual produk yang memakai bahan paling berisiko.";
  }
  if (riskLevel === "Medium") {
    return "Pantau supplier dan margin produk utama; lakukan pembelian bertahap jika harga mulai bergerak naik.";
  }
  return "Pertahankan pola pembelian normal dan lanjutkan pemantauan tren harga secara berkala.";
}

function buildFallbackActionPlan(riskLevel: RiskLevel) {
  if (riskLevel === "High") {
    return [
      {
        action: "Cek stok bahan utama untuk 1-2 minggu ke depan",
        priority: "High" as const,
        reason: "Risiko tinggi dapat cepat menekan biaya jika stok rendah.",
      },
      {
        action: "Bandingkan harga dari minimal dua supplier",
        priority: "High" as const,
        reason: "Alternatif supplier membantu menahan kenaikan biaya.",
      },
      {
        action: "Hitung ulang margin produk yang memakai bahan berisiko",
        priority: "Medium" as const,
        reason: "Margin perlu dijaga sebelum memutuskan penyesuaian harga jual.",
      },
    ];
  }

  if (riskLevel === "Medium") {
    return [
      {
        action: "Pantau harga supplier setiap minggu",
        priority: "Medium" as const,
        reason: "Risiko sedang membutuhkan respons cepat jika tren naik berlanjut.",
      },
      {
        action: "Lakukan pembelian bertahap untuk bahan yang paling penting",
        priority: "Medium" as const,
        reason: "Pembelian bertahap mengurangi risiko salah waktu beli.",
      },
      {
        action: "Tinjau ulang menu atau produk dengan margin tipis",
        priority: "Low" as const,
        reason: "Produk margin tipis lebih sensitif terhadap perubahan biaya.",
      },
    ];
  }

  return [
    {
      action: "Pertahankan jadwal restock normal",
      priority: "Low" as const,
      reason: "Risiko saat ini masih rendah dan belum membutuhkan aksi besar.",
    },
    {
      action: "Simpan catatan harga supplier bulanan",
      priority: "Low" as const,
      reason: "Riwayat supplier membantu membaca perubahan biaya lebih awal.",
    },
    {
      action: "Pantau komoditas utama di dashboard",
      priority: "Low" as const,
      reason: "Pemantauan rutin cukup untuk kondisi harga yang stabil.",
    },
  ];
}

function calculateFallbackConfidence(input: InsightGenerationInput): number {
  const commoditiesWithPrice = input.commodities.filter(
    (item) => item.latestValue != null,
  ).length;
  const hasFx = input.exchangeRate.latestRate != null ? 8 : 0;
  return Math.min(82, 54 + commoditiesWithPrice * 4 + hasFx);
}

function buildSimulatorSuggestions(
  calculation: SimulatorCalculation,
): string[] {
  if (calculation.status === "Perlu Evaluasi Harga") {
    return [
      "Cek ulang harga supplier untuk bahan dengan kontribusi kenaikan terbesar.",
      "Hitung skenario kenaikan harga bertahap agar pelanggan tidak terkejut.",
      "Review ukuran porsi atau resep untuk produk dengan margin paling tipis.",
      "Siapkan alternatif supplier untuk bahan dengan risiko tinggi.",
    ];
  }

  if (calculation.status === "Perlu Monitor") {
    return [
      "Pantau harga bahan utama setiap minggu sebelum restock besar.",
      "Gunakan pembelian bertahap untuk mengurangi risiko salah waktu beli.",
      "Tandai produk ini untuk review margin pada akhir bulan.",
    ];
  }

  return [
    "Pertahankan harga jual saat ini selama margin masih sesuai target.",
    "Simpan catatan perubahan harga bahan untuk perbandingan bulan depan.",
    "Lanjutkan pemantauan komoditas utama di dashboard.",
  ];
}

function formatPercent(value: number): string {
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
