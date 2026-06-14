// =============================================================================
// SupplyWatch AI — World Bank commodity price adapter (Phase 4 scaffold)
//
// Source: World Bank "Commodity Markets" (the "Pink Sheet"), published monthly
// as an Excel workbook. https://www.worldbank.org/en/research/commodity-markets
//
// STATUS: SCAFFOLD. Wiring is in place (env-driven URL, polite fetch, parser
// hook) but the XLS column mapping is left as a clear TODO because the workbook
// layout (sheet name, header rows, column order) must be confirmed against the
// actual file. Until WORLDBANK_DATA_URL is set, this adapter reports itself as
// not configured and the runner falls back to mock data.
//
// Compliance: respects robots.txt by only fetching the published data file (not
// scraping pages), sends a descriptive User-Agent, and rate-limits requests.
// Do NOT point this at endpoints disallowed by the source's Terms of Service.
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

/** Maps World Bank series names -> our commodity slugs. Extend as needed. */
const SLUG_MAP: Record<string, string> = {
  // TODO: confirm exact Pink Sheet series labels and map them here.
  Sugar: "sugar",
  Wheat: "wheat",
  Coffee: "coffee",
  Cocoa: "cocoa",
  "Crude oil, average": "crude_oil",
  "Palm oil": "vegetable_oil",
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
      // Avoid hanging the import indefinitely.
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
    const workbook = XLSX.read(raw.payload as Buffer, { type: "buffer" });

    // TODO: confirm the correct sheet. The Pink Sheet has multiple tabs
    // (e.g. "Monthly Prices"). Pick it explicitly once verified.
    const sheetName =
      process.env.WORLDBANK_SHEET ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`World Bank sheet "${sheetName}" not found`);
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });

    const out: NormalizedCommodityPrice[] = [];

    // TODO: The real workbook is wide (one column per commodity, one row per
    // month) with several header rows. The loop below is a PLACEHOLDER shape;
    // replace with the verified row/column mapping. Until then it yields nothing
    // and the runner falls back to mock.
    for (const _row of rows) {
      void _row;
      // Example of the intended output once mapping is known:
      //   out.push({
      //     kind: "commodity_price",
      //     commoditySlug: SLUG_MAP[seriesName],
      //     date: toIsoMonth(periodCell),
      //     value: Number(valueCell),
      //     currency: "USD",
      //     unit: unitForSeries(seriesName),
      //     source: "World Bank Pink Sheet",
      //   });
    }

    if (out.length === 0) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "XLS column mapping not implemented yet (see TODO in worldbank.ts)",
      );
    }
    return out;
  }
}

/** Exposed for unit tests / future mapping work. */
export const __worldBankSlugMap = SLUG_MAP;
