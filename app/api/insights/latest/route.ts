import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionPlanItem, AiInsightRow, Json } from "@/types/database";
import type { InsightView } from "@/types/insight";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi di environment server." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login diperlukan untuk melihat insight tersimpan." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Insight terbaru gagal dimuat.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    insight: data ? mapInsightRow(data as AiInsightRow) : null,
  });
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
