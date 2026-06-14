// =============================================================================
// SupplyWatch AI — Normalization helpers (Phase 4)
//
// Shared validation/cleaning used by all adapters and the import runner:
//   * validate normalized records (drop garbage rather than corrupt the DB)
//   * dedupe by natural key (commodity+date, pair+date)
//   * recompute MoM/YoY from a clean series
// =============================================================================

import { z } from "zod";
import type {
  NormalizedRecord,
  NormalizedCommodityPrice,
  NormalizedExchangeRate,
} from "./types";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const commodityPriceSchema = z.object({
  kind: z.literal("commodity_price"),
  commoditySlug: z.string().min(1),
  date: isoDate,
  value: z.number().finite(),
  currency: z.string().min(1),
  unit: z.string(),
  source: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const exchangeRateSchema = z.object({
  kind: z.literal("exchange_rate"),
  pair: z.string().min(1),
  date: isoDate,
  rate: z.number().finite().positive(),
  source: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const recordSchema = z.discriminatedUnion("kind", [
  commodityPriceSchema,
  exchangeRateSchema,
]);

export interface ValidationOutcome {
  valid: NormalizedRecord[];
  dropped: number;
}

/** Validate records, silently dropping invalid ones (counted in `dropped`). */
export function validateRecords(records: unknown[]): ValidationOutcome {
  const valid: NormalizedRecord[] = [];
  let dropped = 0;
  for (const r of records) {
    const parsed = recordSchema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else dropped++;
  }
  return { valid, dropped };
}

/** Dedupe by natural key, keeping the last occurrence. */
export function dedupe(records: NormalizedRecord[]): NormalizedRecord[] {
  const map = new Map<string, NormalizedRecord>();
  for (const r of records) {
    const key =
      r.kind === "commodity_price"
        ? `cp:${r.commoditySlug}:${r.date}`
        : `fx:${r.pair}:${r.date}`;
    map.set(key, r);
  }
  return [...map.values()];
}

export function isCommodityPrice(
  r: NormalizedRecord,
): r is NormalizedCommodityPrice {
  return r.kind === "commodity_price";
}

export function isExchangeRate(
  r: NormalizedRecord,
): r is NormalizedExchangeRate {
  return r.kind === "exchange_rate";
}

/**
 * Compute MoM and YoY ratios for a single commodity's price series.
 * Input may be unsorted; output is sorted ascending by date with changes added.
 * Used when a source provides raw values without precomputed changes.
 */
export function computeChanges(
  series: NormalizedCommodityPrice[],
): Array<NormalizedCommodityPrice & { momChange: number | null; yoyChange: number | null }> {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((p) => [p.date, p.value]));

  return sorted.map((p, i) => {
    const prev = i > 0 ? sorted[i - 1].value : null;
    const yearAgoDate = shiftMonths(p.date, -12);
    const yearAgo = byDate.get(yearAgoDate) ?? null;
    return {
      ...p,
      momChange: prev && prev !== 0 ? round4(p.value / prev - 1) : null,
      yoyChange:
        yearAgo && yearAgo !== 0 ? round4(p.value / yearAgo - 1) : null,
    };
  });
}

function shiftMonths(isoDateStr: string, months: number): string {
  const d = new Date(`${isoDateStr}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}
