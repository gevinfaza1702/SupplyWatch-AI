import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buildRuleBasedInsight, buildImpactAnalysisPrompt } from "@/lib/ai/prompts";
import { safeParseAiInsightJson } from "@/lib/ai/parse-json";
import { generateAiText } from "@/lib/ai/provider";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { BUSINESS_TYPE_VALUES } from "@/lib/business-types";
import { BUSINESS_COMMODITY_WEIGHTS } from "@/lib/commodities/business-weights";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AiInsightPayload, InsightGenerationInput, InsightView } from "@/types/insight";
import type {
  ActionPlanItem,
  AiInsightRow,
  BusinessType,
  Database,
  Json,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const businessTypeSchema = z.enum(BUSINESS_TYPE_VALUES);
const requestSchema = z.object({
  businessType: businessTypeSchema.optional(),
  /** Regenerate even if a cached insight exists for this period. */
  force: z.boolean().optional(),
});

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AiInsightInsert = Database["public"]["Tables"]["ai_insights"]["Insert"];

interface ProfileSnapshot {
  business_type: BusinessType | null;
  location: string | null;
  target_margin: number | null;
  monthly_raw_material_budget: number | null;
}

export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi di environment server." },
      { status: 503 },
    );
  }

  const body = await parseBody(req);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login diperlukan untuk membuat dan menyimpan insight." },
      { status: 401 },
    );
  }

  const profile = await loadProfile(supabase, user.id);
  const businessType =
    body.data.businessType ?? profile?.business_type ?? "bakery";
  const period = getCurrentPeriod();

  // Cache: reuse this period's insight unless the caller forces a refresh.
  // Saves an AI call (and cost) on repeated visits within the same month.
  if (!body.data.force) {
    const { data: existing } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_type", businessType)
      .eq("period", period)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        source: "cache",
        insight: mapInsightRow(existing as AiInsightRow),
      });
    }
  }

  try {
    // Persisted insights must reflect real data, not demo/mock — force live.
    const dashboard = await getDashboardData(businessType, { forceLive: true });
    const weights = await loadBusinessWeights(supabase, businessType);
    const input = buildInsightInput({
      businessType,
      profile,
      dashboard,
      weights,
    });
    const prompt = buildImpactAnalysisPrompt(input);

    let insight: AiInsightPayload;
    let isFallback = false;
    let aiMeta: Json = null;

    try {
      const generated = await generateAiText({ prompt });
      const parsed = safeParseAiInsightJson(generated.text);

      if (!parsed.ok) {
        throw new Error(`AI JSON tidak valid: ${parsed.error}`);
      }

      insight = parsed.data;
      aiMeta = {
        provider: generated.provider,
        model: generated.model,
        parsed: true,
      };
    } catch (error) {
      isFallback = true;
      insight = buildRuleBasedInsight(input);
      aiMeta = {
        fallback_reason:
          error instanceof Error ? error.message : "AI gagal diproses.",
      };
    }

    const inputSnapshot = toJson({
      prompt_version: "impact-analysis-v1",
      generated_at: dashboard.generatedAt,
      data_source: dashboard.source,
      ai: aiMeta,
      input,
    });

    const insertPayload: AiInsightInsert = {
      user_id: user.id,
      business_type: businessType,
      period,
      input_snapshot: inputSnapshot,
      summary: insight.summary,
      impact_analysis: insight.impact_analysis,
      main_drivers: toJson(insight.main_drivers),
      recommendation: insight.recommendation,
      action_plan: toJson(insight.action_plan),
      risk_level: insight.risk_level,
      confidence_score: insight.confidence_score,
      disclaimer: insight.disclaimer,
      is_fallback: isFallback,
    };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ai_insights")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Insight gagal disimpan.", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      source: isFallback ? "rule-based" : "ai",
      insight: mapInsightRow(data as AiInsightRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Insight gagal dibuat.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function parseBody(
  req: NextRequest,
): Promise<
  | { ok: true; data: z.infer<typeof requestSchema> }
  | { ok: false; error: string }
> {
  try {
    const raw = await req.text();
    if (!raw.trim()) return { ok: true, data: {} };

    const json = JSON.parse(raw) as unknown;
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: "Body request tidak valid." };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "Body harus berupa JSON valid." };
  }
}

async function loadProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProfileSnapshot | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "business_type, location, target_margin, monthly_raw_material_budget",
    )
    .eq("id", userId)
    .maybeSingle();

  return (data as ProfileSnapshot | null) ?? null;
}

async function loadBusinessWeights(
  supabase: SupabaseServerClient,
  businessType: BusinessType,
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("business_commodity_weights")
    .select("commodity_id, weight")
    .eq("business_type", businessType);

  const rows = (data ?? []) as Array<{ commodity_id: string; weight: number }>;
  return new Map(rows.map((row) => [row.commodity_id, row.weight]));
}

function buildInsightInput(args: {
  businessType: BusinessType;
  profile: ProfileSnapshot | null;
  dashboard: Awaited<ReturnType<typeof getDashboardData>>;
  weights: Map<string, number>;
}): InsightGenerationInput {
  const commodities = [...args.dashboard.commodities]
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, 8)
    .map((commodity) => ({
      name: commodity.name,
      slug: commodity.slug,
      latestValue: commodity.latestValue,
      momChange: commodity.momChange,
      yoyChange: commodity.yoyChange,
      riskLevel: commodity.riskLevel,
      weight:
        args.weights.get(commodity.id) ??
        BUSINESS_COMMODITY_WEIGHTS[args.businessType][commodity.slug] ??
        0.5,
    }));

  return {
    businessType: args.businessType,
    location: args.profile?.location ?? null,
    targetMargin: args.profile?.target_margin ?? null,
    monthlyBudget: args.profile?.monthly_raw_material_budget ?? null,
    commodities,
    exchangeRate: {
      pair: args.dashboard.exchangeRate.pair,
      latestRate: args.dashboard.exchangeRate.latestRate,
      momChange: args.dashboard.exchangeRate.momChange,
    },
  };
}

function mapInsightRow(row: AiInsightRow): InsightView {
  return {
    id: row.id,
    businessType: row.business_type,
    period: row.period,
    summary: row.summary,
    impactAnalysis: row.impact_analysis,
    mainDrivers: toStringArray(row.main_drivers),
    recommendation: row.recommendation,
    actionPlan: toActionPlan(row.action_plan),
    riskLevel: row.risk_level,
    confidenceScore: row.confidence_score,
    disclaimer: row.disclaimer,
    createdAt: row.created_at,
    isFallback: row.is_fallback,
  };
}

function getCurrentPeriod(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function toStringArray(value: Json | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
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
