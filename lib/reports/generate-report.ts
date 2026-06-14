import "server-only";

import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { createClient } from "@/lib/supabase/server";
import { formatPercent, formatRupiah } from "@/lib/utils";
import type {
  ActionPlanItem,
  AiInsightRow,
  BusinessType,
  Json,
  ProfileRow,
  ReportRow,
  RiskLevel,
  SimulationResultRow,
} from "@/types/database";
import type { ReportView, WeeklyReportContent } from "@/types/report";

const BUSINESS_LABELS: Record<BusinessType, string> = {
  bakery: "Toko roti",
  coffee_shop: "Kedai kopi",
  restaurant: "Restoran",
};

export async function generateWeeklyReportContent(
  userId: string,
): Promise<WeeklyReportContent> {
  const supabase = await createClient();
  const [{ data: profileData }, { data: aiData }, { data: simulationData }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("simulation_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileData as ProfileRow | null;
  const businessType = profile?.business_type ?? "bakery";
  const dashboard = await getDashboardData(businessType);
  const latestAiInsight = aiData ? mapAiInsight(aiData as AiInsightRow) : null;
  const latestSimulation = simulationData
    ? mapSimulation(simulationData as SimulationResultRow)
    : null;
  const period = getCurrentWeekPeriod();
  const businessLabel = BUSINESS_LABELS[businessType];
  const title = `Laporan Mingguan SupplyWatch AI - ${businessLabel}`;

  const actionRecommendations = buildActionRecommendations({
    aiInsight: latestAiInsight,
    dashboardRecommendation: dashboard.summary.mainRecommendation,
    simulation: latestSimulation,
  });

  return {
    title,
    period,
    generatedAt: new Date().toISOString(),
    businessProfile: {
      businessType,
      companyName: profile?.company_name ?? null,
      location: profile?.location ?? null,
      targetMargin: profile?.target_margin ?? null,
      monthlyBudget: profile?.monthly_raw_material_budget ?? null,
    },
    executiveSummary: buildExecutiveSummary({
      businessLabel,
      riskLevel: dashboard.summary.weeklyRiskLevel,
      riskiestCommodity: dashboard.summary.riskiestCommodity,
      aiSummary: latestAiInsight?.summary ?? null,
      simulation: latestSimulation,
    }),
    weeklyRiskLevel: dashboard.summary.weeklyRiskLevel,
    topRiskyCommodities: dashboard.topRisky.slice(0, 5).map((item) => ({
      name: item.name,
      riskLevel: item.riskLevel,
      riskScore: item.riskScore,
      momChange: item.momChange,
      yoyChange: item.yoyChange,
      recommendation: item.recommendation,
    })),
    exchangeRate: dashboard.exchangeRate,
    latestAiInsight,
    latestSimulation,
    actionRecommendations,
    disclaimer:
      "Laporan ini bersifat estimasi berbasis data historis, risk engine, AI insight, dan input simulasi. Laporan bukan kepastian harga pasar atau nasihat keuangan.",
  };
}

export function mapReportRow(row: ReportRow): ReportView {
  return {
    id: row.id,
    title: row.title,
    period: row.period,
    content: parseReportContent(row.content),
    pdfUrl: row.pdf_url,
    createdAt: row.created_at,
  };
}

export function reportContentToJson(content: WeeklyReportContent): Json {
  return JSON.parse(JSON.stringify(content)) as Json;
}

function mapAiInsight(row: AiInsightRow): WeeklyReportContent["latestAiInsight"] {
  return {
    summary: row.summary,
    impactAnalysis: row.impact_analysis,
    recommendation: row.recommendation,
    actionPlan: toActionPlan(row.action_plan),
    riskLevel: row.risk_level,
    createdAt: row.created_at,
  };
}

function mapSimulation(
  row: SimulationResultRow,
): WeeklyReportContent["latestSimulation"] {
  return {
    productName: row.product_name,
    sellingPrice: row.selling_price,
    currentCost: row.current_cost,
    estimatedNewCost: row.estimated_new_cost,
    estimatedNewMargin: row.estimated_new_margin,
    recommendedPrice: row.recommended_price,
    aiExplanation: row.ai_explanation,
    createdAt: row.created_at,
  };
}

function buildExecutiveSummary(args: {
  businessLabel: string;
  riskLevel: RiskLevel;
  riskiestCommodity: string | null;
  aiSummary: string | null;
  simulation: WeeklyReportContent["latestSimulation"];
}): string {
  const riskText =
    args.riskLevel === "High"
      ? "tinggi"
      : args.riskLevel === "Medium"
        ? "sedang"
        : "rendah";
  const commodityText = args.riskiestCommodity
    ? `Komoditas yang paling perlu dipantau adalah ${args.riskiestCommodity}.`
    : "Belum ada komoditas dominan yang perlu tindakan besar.";
  const simulationText = args.simulation?.productName
    ? `Simulasi terakhir untuk ${args.simulation.productName} menunjukkan estimasi margin ${formatNullablePercent(args.simulation.estimatedNewMargin)} dengan rekomendasi harga ${formatNullableRupiah(args.simulation.recommendedPrice)}.`
    : "Belum ada hasil simulator terbaru yang masuk ke laporan.";

  if (args.aiSummary) {
    return `${args.businessLabel} berada pada level risiko ${riskText}. ${args.aiSummary} ${simulationText}`;
  }

  return `${args.businessLabel} berada pada level risiko ${riskText}. ${commodityText} ${simulationText}`;
}

function buildActionRecommendations(args: {
  aiInsight: WeeklyReportContent["latestAiInsight"];
  dashboardRecommendation: string | null;
  simulation: WeeklyReportContent["latestSimulation"];
}): string[] {
  const recommendations = new Set<string>();

  if (args.dashboardRecommendation) {
    recommendations.add(args.dashboardRecommendation);
  }

  for (const item of args.aiInsight?.actionPlan ?? []) {
    recommendations.add(`${item.action}: ${item.reason}`);
  }

  if (args.aiInsight?.recommendation) {
    recommendations.add(args.aiInsight.recommendation);
  }

  if (args.simulation?.recommendedPrice && args.simulation?.productName) {
    recommendations.add(
      `Review harga ${args.simulation.productName}; harga rekomendasi simulator adalah ${formatRupiah(args.simulation.recommendedPrice)}.`,
    );
  }

  if (!recommendations.size) {
    recommendations.add("Pantau harga bahan utama dan kurs USD/IDR secara berkala.");
    recommendations.add("Review margin produk prioritas sebelum restock besar.");
  }

  return Array.from(recommendations).slice(0, 6);
}

function parseReportContent(value: Json | null): WeeklyReportContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, Json | undefined>;
  if (typeof candidate.title !== "string") return null;
  if (typeof candidate.period !== "string") return null;
  return candidate as unknown as WeeklyReportContent;
}

function toActionPlan(value: Json | null): ActionPlanItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const action = item.action;
    const priority = item.priority;
    const reason = item.reason;
    if (
      typeof action !== "string" ||
      typeof reason !== "string" ||
      (priority !== "Low" && priority !== "Medium" && priority !== "High")
    ) {
      return [];
    }
    return [{ action, priority, reason }];
  });
}

function getCurrentWeekPeriod(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatNullablePercent(value: number | null | undefined): string {
  return value == null ? "-" : formatPercent(value);
}

function formatNullableRupiah(value: number | null | undefined): string {
  return value == null ? "-" : formatRupiah(value);
}
