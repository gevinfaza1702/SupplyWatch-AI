// =============================================================================
// SupplyWatch AI — USD/IDR exchange-rate adapter
//
// Primary source: Frankfurter API (https://frankfurter.dev) — free, no API key,
// backed by European Central Bank reference rates. Clear ToS, no scraping.
// Returns daily USD/IDR which we aggregate to MONTHLY (last available business
// day of each month) to match our monthly commodity cadence.
//
// Why not Bank Indonesia JISDOR directly? BI publishes JISDOR only as an HTML
// page (no stable public data file), so scraping it would risk their ToS. If a
// sanctioned JISDOR CSV/Excel becomes available, set BI_JISDOR_URL to it and
// this adapter will parse that instead (date + rate columns).
//
// sourceName stays "bank-indonesia" so the import runner wiring is unchanged.
// =============================================================================

import { parse } from "csv-parse/sync";
import {
  type DataSourceAdapter,
  type RawDataResult,
  type NormalizedRecord,
  type NormalizedExchangeRate,
  RateLimiter,
  USER_AGENT,
} from "./types";

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";
/** How many months of history to fetch. */
const MONTHS_BACK = 48;
const limiter = new RateLimiter(1200);

export class BankIndonesiaSource implements DataSourceAdapter {
  readonly sourceName = "bank-indonesia";
  readonly kind = "exchange_rate" as const;

  /** Optional override: a sanctioned JISDOR CSV (date,rate). */
  private get csvUrl(): string | undefined {
    return process.env.BI_JISDOR_URL || undefined;
  }

  async fetchLatest(): Promise<RawDataResult> {
    await limiter.wait();

    // CSV override path (e.g. an official JISDOR export the user provides).
    if (this.csvUrl) {
      const res = await fetch(this.csvUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        throw new Error(
          `JISDOR CSV fetch failed: ${res.status} ${res.statusText}`,
        );
      }
      return {
        payload: { kind: "csv", text: await res.text() },
        fetchedFrom: this.csvUrl,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Default: Frankfurter daily USD/IDR over the window.
    const start = isoDaysMonthsAgo(MONTHS_BACK);
    const url = `${FRANKFURTER_BASE}/${start}..?base=USD&symbols=IDR`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(`Frankfurter fetch failed: ${res.status} ${res.statusText}`);
    }

    return {
      payload: { kind: "frankfurter", json: await res.json() },
      fetchedFrom: url,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(raw: RawDataResult): Promise<NormalizedRecord[]> {
    const payload = raw.payload as
      | { kind: "frankfurter"; json: FrankfurterTimeSeries }
      | { kind: "csv"; text: string };

    const daily =
      payload.kind === "frankfurter"
        ? fromFrankfurter(payload.json)
        : fromCsv(payload.text);

    // Aggregate daily -> monthly: keep the last available day per YYYY-MM.
    const byMonth = new Map<string, { date: string; rate: number }>();
    for (const d of daily) {
      const month = d.date.slice(0, 7); // YYYY-MM
      const existing = byMonth.get(month);
      if (!existing || d.date > existing.date) byMonth.set(month, d);
    }

    const source =
      payload.kind === "frankfurter"
        ? "Frankfurter / ECB (USD/IDR)"
        : "Bank Indonesia JISDOR";

    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map<NormalizedExchangeRate>(([month, d]) => ({
        kind: "exchange_rate",
        pair: "USD/IDR",
        date: `${month}-01`, // normalize to first-of-month (monthly series)
        rate: d.rate,
        source,
        metadata: { observed_on: d.date },
      }));
  }
}

// --- Parsers -----------------------------------------------------------------

interface FrankfurterTimeSeries {
  base?: string;
  rates?: Record<string, { IDR?: number }>;
}

function fromFrankfurter(
  json: FrankfurterTimeSeries,
): Array<{ date: string; rate: number }> {
  const rates = json.rates ?? {};
  const out: Array<{ date: string; rate: number }> = [];
  for (const [date, obj] of Object.entries(rates)) {
    const idr = obj?.IDR;
    if (typeof idr === "number" && Number.isFinite(idr)) {
      out.push({ date, rate: idr });
    }
  }
  return out;
}

/** Parse an optional JISDOR-style CSV with a date column and a rate column. */
function fromCsv(text: string): Array<{ date: string; rate: number }> {
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const dateCol = process.env.BI_DATE_COL ?? "date";
  const rateCol = process.env.BI_RATE_COL ?? "rate";

  const out: Array<{ date: string; rate: number }> = [];
  for (const row of rows) {
    const date = toIsoDate(row[dateCol]);
    // Indonesian formatting may use "." thousands / "," decimals.
    const rate = parseLooseNumber(row[rateCol]);
    if (date && Number.isFinite(rate)) out.push({ date, rate });
  }
  return out;
}

// --- Helpers -----------------------------------------------------------------

function isoDaysMonthsAgo(months: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function toIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseLooseNumber(value: string | undefined): number {
  if (!value) return NaN;
  // Remove thousands separators, normalize decimal comma.
  const cleaned = value.trim().replace(/\./g, "").replace(/,/g, ".");
  return Number(cleaned);
}
