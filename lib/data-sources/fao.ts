// =============================================================================
// SupplyWatch AI — FAO Food Price Index adapter (Phase 4 scaffold)
//
// Source: FAO Food Price Index (FFPI), published monthly as CSV/XLSX. It
// includes a headline index plus sub-indices (Cereals, Dairy, Meat, Oils,
// Sugar). https://www.fao.org/worldfoodsituation/foodpricesindex
//
// STATUS: SCAFFOLD. The CSV parsing path is wired (env-driven URL, polite
// fetch, csv-parse) but the exact column headers must be confirmed against the
// real file, so the row mapping is a clear TODO. Until FAO_DATA_URL is set,
// this adapter reports itself as not configured and the runner falls back.
//
// Compliance: fetches only the published data file, sends a descriptive
// User-Agent, and rate-limits. No page scraping.
// =============================================================================

import { parse } from "csv-parse/sync";
import {
  type DataSourceAdapter,
  type RawDataResult,
  type NormalizedRecord,
  type NormalizedCommodityPrice,
  SourceNotConfiguredError,
  RateLimiter,
  USER_AGENT,
} from "./types";

/**
 * Maps FAO sub-index columns -> our commodity slugs. The FFPI is an index, not
 * a per-commodity price, so we treat sub-indices as proxies for the relevant
 * raw materials.
 */
const SUBINDEX_MAP: Record<string, string> = {
  // TODO: confirm exact CSV header names.
  "Cereals Price Index": "wheat",
  "Dairy Price Index": "dairy",
  "Oils Price Index": "vegetable_oil",
  "Sugar Price Index": "sugar",
};

const limiter = new RateLimiter(1500);

export class FaoSource implements DataSourceAdapter {
  readonly sourceName = "fao";
  readonly kind = "commodity_price" as const;

  private get url(): string | undefined {
    return process.env.FAO_DATA_URL;
  }

  async fetchLatest(): Promise<RawDataResult> {
    if (!this.url) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "FAO_DATA_URL not set",
      );
    }

    await limiter.wait();
    const res = await fetch(this.url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(`FAO fetch failed: ${res.status} ${res.statusText}`);
    }

    return {
      payload: await res.text(),
      fetchedFrom: this.url,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(raw: RawDataResult): Promise<NormalizedRecord[]> {
    const rows = parse(raw.payload as string, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    const out: NormalizedCommodityPrice[] = [];

    // TODO: confirm the date column name and sub-index column headers, then map.
    // The loop below is a PLACEHOLDER; until implemented it yields nothing and
    // the runner falls back to mock.
    for (const _row of rows) {
      void _row;
      // Intended output once headers are known:
      //   for (const [col, slug] of Object.entries(SUBINDEX_MAP)) {
      //     const v = Number(row[col]);
      //     if (!Number.isFinite(v)) continue;
      //     out.push({
      //       kind: "commodity_price",
      //       commoditySlug: slug,
      //       date: toIsoMonth(row["Date"]),
      //       value: v,
      //       currency: "USD",
      //       unit: "Index (2014-2016=100)",
      //       source: "FAO Food Price Index",
      //     });
      //   }
    }

    if (out.length === 0) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "CSV column mapping not implemented yet (see TODO in fao.ts)",
      );
    }
    return out;
  }
}

export const __faoSubIndexMap = SUBINDEX_MAP;
