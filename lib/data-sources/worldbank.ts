// =============================================================================
// SupplyWatch AI — World Bank commodity price adapter
//
// Source: World Bank "Commodity Markets" (the "Pink Sheet").
// https://www.worldbank.org/en/research/commodity-markets
//
// This adapter reads a TIDY long-format data file (CSV or XLSX) that you point
// WORLDBANK_DATA_URL at — three columns: date, series, value. This is the
// robust, Terms-of-Service-safe path: you supply a published/cleaned data file
// rather than scraping the multi-header Pink Sheet workbook directly.
//
// Column names are configurable via env (defaults shown):
//   WORLDBANK_DATE_COL   = "date"
//   WORLDBANK_SERIES_COL = "series"
//   WORLDBANK_VALUE_COL  = "value"
//   WORLDBANK_SHEET      = first sheet (XLSX only)
//
// Series names are mapped to our slugs via SLUG_MAP (extendable). Rows whose
// series isn't mapped are skipped. If WORLDBANK_DATA_URL is unset, the adapter
// reports itself not-configured and the import runner falls back to mock.
//
// Compliance: fetches only the file you configure, sends a descriptive
// User-Agent, rate-limits, and times out. No page scraping.
// =============================================================================

import * as XLSX from "xlsx";
import {
  type DataSourceAdapter,
  type RawDataResult,
  type NormalizedRecord,
  type NormalizedCommodityPrice,
  SourceNotConfiguredError,
  RateLimiter,
  USER_AGENT,
} from "./types";

/** Maps World Bank series labels -> our commodity slugs (case-insensitive). */
const SLUG_MAP: Record<string, string> = {
  sugar: "sugar",
  "sugar, world": "sugar",
  wheat: "wheat",
  "wheat, us hrw": "wheat",
  coffee: "coffee",
  "coffee, arabica": "coffee",
  cocoa: "cocoa",
  "crude oil": "crude_oil",
  "crude oil, average": "crude_oil",
  "palm oil": "vegetable_oil",
  "soybean oil": "vegetable_oil",
};

const limiter = new RateLimiter(1500);

export class WorldBankSource implements DataSourceAdapter {
  readonly sourceName = "worldbank";
  readonly kind = "commodity_price" as const;

  private get url(): string | undefined {
    return process.env.WORLDBANK_DATA_URL;
  }

  async fetchLatest(): Promise<RawDataResult> {
    if (!this.url) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "WORLDBANK_DATA_URL not set",
      );
    }

    await limiter.wait();
    const res = await fetch(this.url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(
        `World Bank fetch failed: ${res.status} ${res.statusText}`,
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      payload: buffer,
      fetchedFrom: this.url,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(raw: RawDataResult): Promise<NormalizedRecord[]> {
    const rows = readRows(raw.payload as Buffer);

    const dateCol = process.env.WORLDBANK_DATE_COL ?? "date";
    const seriesCol = process.env.WORLDBANK_SERIES_COL ?? "series";
    const valueCol = process.env.WORLDBANK_VALUE_COL ?? "value";

    const out: NormalizedCommodityPrice[] = [];
    for (const row of rows) {
      const series = String(row[seriesCol] ?? "").trim();
      const slug = SLUG_MAP[series.toLowerCase()];
      if (!slug) continue; // unmapped series — skip safely

      const date = toIsoDate(row[dateCol]);
      const value = Number(row[valueCol]);
      if (!date || !Number.isFinite(value)) continue;

      out.push({
        kind: "commodity_price",
        commoditySlug: slug,
        date,
        value,
        currency: "USD",
        unit: "USD",
        source: "World Bank Commodity Markets",
        metadata: { series },
      });
    }

    if (out.length === 0) {
      throw new Error(
        "World Bank file parsed but produced 0 mapped rows. Check column " +
          "names (WORLDBANK_DATE_COL/SERIES_COL/VALUE_COL) and series labels.",
      );
    }
    return out;
  }
}

/** Parse a CSV or XLSX buffer into an array of row objects. */
function readRows(buffer: Buffer): Array<Record<string, unknown>> {
  // XLSX.read handles both real workbooks and CSV text buffers.
  // raw:true keeps cell values literal so date strings like "2025-06" are NOT
  // auto-coerced into Excel serial numbers.
  const workbook = XLSX.read(buffer, { type: "buffer", raw: true });
  const sheetName = process.env.WORLDBANK_SHEET ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`World Bank sheet "${sheetName}" not found`);
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
}

/** Normalize a date cell to YYYY-MM-DD. Accepts ISO, YYYY-MM, and Date. */
function toIsoDate(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  // Excel serial date number (days since 1899-12-30).
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  const s = String(value).trim();
  // YYYY-MM -> first of month
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Fallback: let Date try, then format.
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Exposed for unit tests / future mapping work. */
export const __worldBankSlugMap = SLUG_MAP;
