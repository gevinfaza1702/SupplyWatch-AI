import { z } from "zod";
import type { AiInsightPayload } from "@/types/insight";

const actionPlanItemSchema = z.object({
  action: z.string().trim().min(1),
  priority: z.enum(["Low", "Medium", "High"]),
  reason: z.string().trim().min(1),
});

const aiInsightPayloadSchema = z.object({
  summary: z.string().trim().min(1),
  risk_level: z.enum(["Low", "Medium", "High"]),
  impact_analysis: z.string().trim().min(1),
  main_drivers: z.array(z.string().trim().min(1)).min(1).max(8),
  recommendation: z.string().trim().min(1),
  action_plan: z.array(actionPlanItemSchema).min(1).max(8),
  confidence_score: z.number().min(0).max(100),
  disclaimer: z.string().trim().min(1),
});

export type SafeAiInsightParseResult =
  | { ok: true; data: AiInsightPayload }
  | { ok: false; error: string; raw: string };

export function safeParseAiInsightJson(raw: string): SafeAiInsightParseResult {
  try {
    const jsonText = extractJsonObject(stripCodeFence(raw));
    if (!jsonText) {
      return { ok: false, error: "Tidak menemukan objek JSON.", raw };
    }

    const parsed = JSON.parse(jsonText) as unknown;
    const result = aiInsightPayloadSchema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        error: result.error.issues.map((issue) => issue.message).join("; "),
        raw,
      };
    }

    return { ok: true, data: result.data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "JSON tidak valid.",
      raw,
    };
  }
}

export function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}
