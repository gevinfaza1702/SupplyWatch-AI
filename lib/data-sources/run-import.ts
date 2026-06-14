// =============================================================================
// SupplyWatch AI — Import runner (Phase 4)
//
// Orchestrates: pick adapters -> fetch -> normalize -> validate/dedupe -> upsert
// to Supabase -> write data_import_logs. On SourceNotConfiguredError it falls
// back to the matching mock adapter so an import always produces usable data.
//
// Server-only: uses the service-role admin client (bypasses RLS) to write
// shared/public tables. Never import this into client code.
// =============================================================================

// NOTE: this module does NOT import "server-only" or lib/supabase/admin.ts
// (both of which break under tsx for the CLI script). Callers pass in an admin
// client. The Next.js API route builds it via lib/supabase/admin.ts (which IS
// server-only), so the service-role key never reaches client code.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  type DataSourceAdapter,
  type ImportResult,
  type NormalizedRecord,
  SourceNotConfiguredError,
} from "./types";
import {
  validateRecords,
  dedupe,
  isCommodityPrice,
  isExchangeRate,
  computeChanges,
} from "./normalize";
import {
  MockCommoditySource,
  MockExchangeRateSource,
  getMockCommodities,
} from "./mock-source";
import { WorldBankSource } from "./worldbank";
import { FaoSource } from "./fao";
import { BankIndonesiaSource } from "./bank-indonesia";

type AdminClient = SupabaseClient<Database>;

export type SourceKey = "worldbank" | "fao" | "bank-indonesia" | "mock";

/** Resolve which adapters to run, each paired with its mock fallback. */
function resolveAdapters(
  sources: SourceKey[],
): Array<{ primary: DataSourceAdapter; fallback: DataSourceAdapter }> {
  const mockCommodity = new MockCommoditySource();
  const mockFx = new MockExchangeRateSource();

  const out: Array<{ primary: DataSourceAdapter; fallback: DataSourceAdapter }> = [];
  for (const s of sources) {
    switch (s) {
      case "worldbank":
        out.push({ primary: new WorldBankSource(), fallback: mockCommodity });
        break;
      case "fao":
        out.push({ primary: new FaoSource(), fallback: mockCommodity });
        break;
      case "bank-indonesia":
        out.push({ primary: new BankIndonesiaSource(), fallback: mockFx });
        break;
      case "mock":
        out.push({ primary: mockCommodity, fallback: mockCommodity });
        out.push({ primary: mockFx, fallback: mockFx });
        break;
    }
  }
  return out;
}

export interface RunImportOptions {
  /** Which sources to run. Defaults to mock for safe local dev. */
  sources?: SourceKey[];
  /** If false, do not fall back to mock when a source is not configured. */
  allowFallback?: boolean;
  /**
   * Admin (service-role) Supabase client. REQUIRED. The Next API route passes
   * one from lib/supabase/admin.ts; the CLI script builds one directly. This
   * keeps run-import.ts free of server-only imports so it runs under tsx.
   */
  admin: AdminClient;
}

/** Build a service-role admin client from env (used by the CLI script). */
export function createImportAdminClient(): AdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Run the full import for the requested sources. */
export async function runImport(
  opts: RunImportOptions,
): Promise<{ results: ImportResult[]; totalImported: number }> {
  const sources = opts.sources ?? ["mock"];
  const allowFallback = opts.allowFallback ?? true;
  const admin = opts.admin;

  // Ensure the commodities master exists before importing prices, so a fresh
  // database (no seed run) still works end-to-end.
  await ensureCommodities(admin);

  const pairs = resolveAdapters(sources);

  const results: ImportResult[] = [];
  for (const { primary, fallback } of pairs) {
    results.push(await runOne(admin, primary, fallback, allowFallback));
  }

  const totalImported = results.reduce((n, r) => n + r.recordsImported, 0);
  return { results, totalImported };
}

/** Upsert the commodities master from the mock catalog (idempotent). */
async function ensureCommodities(admin: AdminClient): Promise<void> {
  const rows = getMockCommodities().map((c) => ({
    name: c.name,
    slug: c.slug,
    category: c.category,
    unit: c.unit,
    source: c.source,
    description: c.description,
  }));
  const { error } = await admin
    .from("commodities")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`Ensure commodities failed: ${error.message}`);
}

async function runOne(
  admin: AdminClient,
  primary: DataSourceAdapter,
  fallback: DataSourceAdapter,
  allowFallback: boolean,
): Promise<ImportResult> {
  const startedAt = new Date().toISOString();

  // Open a log row immediately so even a crash leaves a trace.
  const { data: logRow } = await admin
    .from("data_import_logs")
    .insert({ source: primary.sourceName, status: "running" })
    .select("id")
    .single();
  const logId = logRow?.id;

  let usedFallback = false;
  let adapter = primary;

  try {
    let records: NormalizedRecord[];
    try {
      const raw = await adapter.fetchLatest();
      records = await adapter.normalize(raw);
    } catch (err) {
      if (err instanceof SourceNotConfiguredError && allowFallback) {
        usedFallback = true;
        adapter = fallback;
        const raw = await adapter.fetchLatest();
        records = await adapter.normalize(raw);
      } else {
        throw err;
      }
    }

    const { valid } = validateRecords(records);
    const clean = dedupe(valid);
    const imported = await persist(admin, clean);

    const finishedAt = new Date().toISOString();
    if (logId) {
      await admin
        .from("data_import_logs")
        .update({
          source: adapter.sourceName,
          status: "success",
          records_imported: imported,
          finished_at: finishedAt,
        })
        .eq("id", logId);
    }

    return {
      source: adapter.sourceName,
      status: "success",
      recordsImported: imported,
      usedFallback,
      startedAt,
      finishedAt,
    };
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await admin
        .from("data_import_logs")
        .update({
          status: "error",
          error_message: message,
          finished_at: finishedAt,
        })
        .eq("id", logId);
    }
    return {
      source: primary.sourceName,
      status: "error",
      recordsImported: 0,
      usedFallback,
      errorMessage: message,
      startedAt,
      finishedAt,
    };
  }
}

/** Upsert normalized records into the right tables. Returns rows written. */
async function persist(
  admin: AdminClient,
  records: NormalizedRecord[],
): Promise<number> {
  const prices = records.filter(isCommodityPrice);
  const rates = records.filter(isExchangeRate);
  let written = 0;

  if (prices.length) {
    // Map slugs -> commodity ids (commodities must already exist via seed).
    const slugs = [...new Set(prices.map((p) => p.commoditySlug))];
    const { data: commodities, error: cErr } = await admin
      .from("commodities")
      .select("id, slug")
      .in("slug", slugs);
    if (cErr) throw new Error(`Lookup commodities failed: ${cErr.message}`);

    const idBySlug = new Map((commodities ?? []).map((c) => [c.slug, c.id]));

    // Compute MoM/YoY per commodity from the incoming series.
    const bySlug = new Map<string, typeof prices>();
    for (const p of prices) {
      const arr = bySlug.get(p.commoditySlug) ?? [];
      arr.push(p);
      bySlug.set(p.commoditySlug, arr);
    }

    const rows: Database["public"]["Tables"]["commodity_prices"]["Insert"][] =
      [];
    for (const [slug, series] of bySlug) {
      const commodityId = idBySlug.get(slug);
      if (!commodityId) continue; // unknown commodity -> skip safely
      for (const p of computeChanges(series)) {
        rows.push({
          commodity_id: commodityId,
          price_date: p.date,
          value: p.value,
          currency: p.currency,
          unit: p.unit,
          mom_change: p.momChange,
          yoy_change: p.yoyChange,
          source: p.source,
        });
      }
    }

    if (rows.length) {
      const { error } = await admin
        .from("commodity_prices")
        .upsert(rows, { onConflict: "commodity_id,price_date" });
      if (error) throw new Error(`Upsert prices failed: ${error.message}`);
      written += rows.length;
    }
  }

  if (rates.length) {
    const rows = rates.map((r) => ({
      pair: r.pair,
      rate_date: r.date,
      rate: r.rate,
      source: r.source,
    }));
    const { error } = await admin
      .from("exchange_rates")
      .upsert(rows, { onConflict: "pair,rate_date" });
    if (error) throw new Error(`Upsert exchange rates failed: ${error.message}`);
    written += rows.length;
  }

  return written;
}
