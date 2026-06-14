import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { extractJsonObject, stripCodeFence } from "@/lib/ai/parse-json";
import {
  buildRuleBasedSimulatorExplanation,
  buildSimulatorExplanationPrompt,
} from "@/lib/ai/prompts";
import { generateAiText } from "@/lib/ai/provider";
import {
  calculateCostImpact,
  SIMULATOR_INGREDIENTS,
  type CommodityImpactMap,
} from "@/lib/simulator/calculate-cost-impact";
import { getCommodities } from "@/lib/commodities/get-commodities";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import type {
  SimulatorAiPayload,
  SimulatorIngredientSlug,
  SimulatorInput,
  SimulatorResultView,
} from "@/types/simulator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SimulationResultInsert =
  Database["public"]["Tables"]["simulation_results"]["Insert"];

const ingredientMixSchema = z.object(
  Object.fromEntries(
    SIMULATOR_INGREDIENTS.map(({ slug }) => [
      slug,
      z.coerce.number().min(0).max(1),
    ]),
  ) as Record<SimulatorIngredientSlug, z.ZodNumber>,
);

const requestSchema = z
  .object({
    productName: z.string().trim().min(2).max(120),
    sellingPrice: z.coerce.number().positive(),
    currentCost: z.coerce.number().positive(),
    targetMargin: z.coerce.number().min(0).max(95),
    ingredientMix: ingredientMixSchema,
  })
  .refine(
    (value) =>
      Object.values(value.ingredientMix).reduce((sum, item) => sum + item, 0) <=
      1.0001,
    {
      message: "Total komposisi bahan tidak boleh lebih dari 100%.",
      path: ["ingredientMix"],
    },
  );

const simulatorAiSchema = z.object({
  ai_explanation: z.string().trim().min(1),
  margin_status: z.string().trim().min(1),
  pricing_recommendation: z.string().trim().min(1),
  operational_suggestions: z.array(z.string().trim().min(1)).min(1).max(8),
  customer_communication_tip: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const userId = await getUserId();
    const { source, commodities } = await getCommodities();
    const commodityImpacts = buildCommodityImpactMap(commodities);
    const calculation = calculateCostImpact(parsed.data, commodityImpacts);
    const ai = await generateSimulatorExplanation(parsed.data, calculation);
    const result: SimulatorResultView = {
      ...calculation,
      productName: parsed.data.productName,
      sellingPrice: parsed.data.sellingPrice,
      currentCost: parsed.data.currentCost,
      targetMargin: parsed.data.targetMargin,
      ingredientMix: parsed.data.ingredientMix,
      ai,
      aiExplanationText: ai.ai_explanation,
    };

    let saved = false;
    let simulationId: string | null = null;
    let createdAt: string | null = null;
    let saveWarning: string | null = null;

    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const insertPayload: SimulationResultInsert = {
        user_id: userId,
        product_name: parsed.data.productName,
        selling_price: parsed.data.sellingPrice,
        current_cost: parsed.data.currentCost,
        target_margin: parsed.data.targetMargin,
        ingredient_mix: toJson(parsed.data.ingredientMix),
        estimated_new_cost: calculation.estimatedNewCost,
        estimated_new_margin: calculation.estimatedNewMargin,
        recommended_price: calculation.recommendedPrice,
        ai_explanation: formatAiExplanationForStorage(ai),
      };

      const admin = createAdminClient();
      const { data, error } = await admin
        .from("simulation_results")
        .insert(insertPayload)
        .select("id, created_at")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Simulasi gagal disimpan.", details: error.message },
          { status: 500 },
        );
      }

      saved = true;
      simulationId = data?.id ?? null;
      createdAt = data?.created_at ?? null;
    } else {
      saveWarning = userId
        ? "Simulasi dihitung, tetapi tidak disimpan karena SUPABASE_SERVICE_ROLE_KEY belum tersedia."
        : "Simulasi dihitung dalam mode demo dan tidak disimpan karena user belum login.";
    }

    return NextResponse.json({
      ok: true,
      source,
      saved,
      saveWarning,
      simulationId,
      createdAt,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Simulasi gagal dijalankan.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getUserId(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function parseRequest(
  req: NextRequest,
): Promise<{ ok: true; data: SimulatorInput } | { ok: false; error: string }> {
  try {
    const json = (await req.json()) as unknown;
    const result = requestSchema.safeParse(json);
    if (!result.success) {
      return {
        ok: false,
        error:
          result.error.issues[0]?.message ??
          "Input simulator tidak valid.",
      };
    }

    return { ok: true, data: result.data };
  } catch {
    return { ok: false, error: "Body harus berupa JSON valid." };
  }
}

function buildCommodityImpactMap(
  commodities: Awaited<ReturnType<typeof getCommodities>>["commodities"],
): CommodityImpactMap {
  const relatedSlugs = new Set(SIMULATOR_INGREDIENTS.map((item) => item.slug));
  const map: CommodityImpactMap = {};

  for (const commodity of commodities) {
    if (!relatedSlugs.has(commodity.slug as SimulatorIngredientSlug)) continue;
    const slug = commodity.slug as SimulatorIngredientSlug;
    map[slug] = {
      name: commodity.name,
      priceChange: commodity.momChange ?? commodity.yoyChange ?? 0,
      riskLevel: commodity.riskLevel,
    };
  }

  return map;
}

async function generateSimulatorExplanation(
  input: SimulatorInput,
  calculation: ReturnType<typeof calculateCostImpact>,
): Promise<SimulatorAiPayload> {
  const fallback = buildRuleBasedSimulatorExplanation({ input, calculation });

  try {
    const generated = await generateAiText({
      prompt: buildSimulatorExplanationPrompt({ input, calculation }),
      temperature: 0.2,
      maxTokens: 900,
    });
    const jsonText = extractJsonObject(stripCodeFence(generated.text));
    if (!jsonText) return fallback;

    const parsed = simulatorAiSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) return fallback;
    return parsed.data;
  } catch {
    return fallback;
  }
}

function formatAiExplanationForStorage(ai: SimulatorAiPayload): string {
  const suggestions = ai.operational_suggestions
    .map((item) => `- ${item}`)
    .join("\n");

  return [
    ai.ai_explanation,
    "",
    `Status: ${ai.margin_status}`,
    `Rekomendasi harga: ${ai.pricing_recommendation}`,
    "",
    "Saran operasional:",
    suggestions,
    "",
    `Komunikasi pelanggan: ${ai.customer_communication_tip}`,
  ].join("\n");
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
