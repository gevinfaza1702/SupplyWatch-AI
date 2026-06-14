// =============================================================================
// SupplyWatch AI — World Bank commodity price adapter
//
// Source: World Bank "Commodity Markets" monthly historical workbook (the
// "Pink Sheet"). https://www.worldbank.org/en/research/commodity-markets
//
// Supports TWO input shapes, auto-detected:
//
//  1) WIDE format — the official Pink Sheet "Monthly Prices" sheet:
//       row 4 = commodity names, row 5 = units, row 6+ = data,
//       column 0 = period "YYYYMmm" (e.g. "2024M12"), "…" = missing.
//     We map specific commodity columns -> our slugs (WIDE_COLUMN_MAP).
//
//  2) LONG format — a tidy file with date/series/value columns (env-configurable
//     WORLDBANK_DATE_COL/SERIES_COL/VALUE_COL). Useful for cleaned CSVs.
//
// If WORLDBANK_DATA_URL is unset, the adapter reports not-configured and the
// import runner falls back to mock. Compliance: fetches only the configured
// file, descriptive User-Agent, rate-limit + timeout. No page scraping.
//
// NOTE: dairy is NOT in the Pink Sheet (it lives in FAO data), so a Pink Sheet
// import covers the other commodities and leaves dairy untouched.
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

/** Pink Sheet (WIDE) column header -> our slug. One column per commodity. */
const WIDE_COLUMN_MAP: Record<string, { slug: string; unit: string }> = {
  "Crude oil, average": { slug: "crude_oil", unit: "USD/bbl" },
  Cocoa: { slug: "cocoa", unit: "USD/kg" },
  "Coffee, Arabica": { slug: "coffee", unit: "USD/kg" },
  "Palm oil": { slug: "vegetable_oil", unit: "USD/mt" },
  "Wheat, US HRW": { slug: "wheat", unit: "USD/mt" },
  "Sugar, world": { slug: "sugar", unit: "USD/kg" },
};

/** LONG format: series label -> slug (case-insensitive). */
const LONG_SLUG_MAP: Record<string, string> = {
  sugar: "sugar",
  wheat: "wheat",
  coffee: "coffee",
  cocoa: "cocoa",
  "crude oil": "crude_oil",
  "palm oil": "vegetable_oil",
};

const MISSING = new Set(["…", "...", "", "n/a", "na"]);
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
      signal: AbortSignal.timeout(30_000),
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
    const workbook = XLSX.read(raw.payload as Buffer, {
      type: "buffer",
      raw: true,
    });

    // Prefer the official "Monthly Prices" sheet (wide). Fall back to the
    // configured/first sheet for long-format CSVs.
    const wideSheetName = workbook.SheetNames.find(
      (n) => n.toLowerCase() === "monthly prices",
    );
    if (wideSheetName) {
      const out = parseWide(workbook.Sheets[wideSheetName]);
      if (out.length) return out;
    }

    const longSheet =
      workbook.Sheets[process.env.WORLDBANK_SHEET ?? workbook.SheetNames[0]];
    const out = parseLong(longSheet);
    if (out.length === 0) {
      throw new Error(
        "World Bank file parsed but produced 0 mapped rows. Check the sheet " +
          "format (expected Pink Sheet 'Monthly Prices' or long-format CSV).",
      );
    }
    return out;
  }
}

// --- WIDE (Pink Sheet) -------------------------------------------------------

function parseWide(sheet: XLSX.WorkSheet): NormalizedCommodityPrice[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    raw: true,
  });

  // Locate the header row: the row containing our known commodity names.
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const cells = (rows[i] ?? []).map((c) => String(c ?? "").trim());
    if (cells.some((c) => c in WIDE_COLUMN_MAP)) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return [];

  // Map target columns: header label -> column index.
  const header = (rows[headerRow] ?? []).map((c) => String(c ?? "").trim());
  const colTargets: Array<{ col: number; slug: string; unit: string }> = [];
  header.forEach((label, col) => {
    const target = WIDE_COLUMN_MAP[label];
    if (target) colTargets.push({ col, slug: target.slug, unit: target.unit });
  });
  if (colTargets.length === 0) return [];

  const out: NormalizedCommodityPrice[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const date = parsePinkSheetPeriod(row[0]);
    if (!date) continue;

    for (const { col, slug, unit } of colTargets) {
      const cell = row[col];
      if (cell == null || MISSING.has(String(cell).trim().toLowerCase())) {
        continue;
      }
      const value = Number(cell);
      if (!Number.isFinite(value)) continue;

      out.push({
        kind: "commodity_price",
        commoditySlug: slug,
        date,
        value,
        currency: "USD",
        unit,
        source: "World Bank Commodity Markets",
        metadata: { series: header[col] },
      });
    }
  }
  return out;
}

/** Parse "YYYYMmm" (e.g. "2024M12") -> "YYYY-MM-01". */
function parsePinkSheetPeriod(value: unknown): string | null {
  if (value == null) return null;
  const m = String(value).trim().match(/^(\d{4})M(\d{2})$/);
  if (!m) return null;
  const [, year, month] = m;
  const mm = Number(month);
  if (mm < 1 || mm > 12) return null;
  return `${year}-${month}-01`;
}

// --- LONG (tidy CSV) ---------------------------------------------------------

function parseLong(sheet: XLSX.WorkSheet): NormalizedCommodityPrice[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  const dateCol = process.env.WORLDBANK_DATE_COL ?? "date";
  const seriesCol = process.env.WORLDBANK_SERIES_COL ?? "series";
  const valueCol = process.env.WORLDBANK_VALUE_COL ?? "value";

  const out: NormalizedCommodityPrice[] = [];
  for (const row of rows) {
    const series = String(row[seriesCol] ?? "").trim();
    const slug = LONG_SLUG_MAP[series.toLowerCase()];
    if (!slug) continue;

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
  return out;
}

/** Normalize a date cell to YYYY-MM-DD (ISO, YYYY-MM, Date, or Excel serial). */
function toIsoDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Exposed for tests. */
export const __wideColumnMap = WIDE_COLUMN_MAP;
export const __longSlugMap = LONG_SLUG_MAP;
