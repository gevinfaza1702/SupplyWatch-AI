// =============================================================================
// SupplyWatch AI — Bank Indonesia JISDOR (USD/IDR) adapter (Phase 4 scaffold)
//
// Source: JISDOR (Jakarta Interbank Spot Dollar Rate), the official BI USD/IDR
// reference rate. BI publishes it on its website; historical data is downloadable
// as CSV/Excel. https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/
//
// STATUS: SCAFFOLD. Two input modes are supported and wired:
//   1) A CSV file/URL you point BI_JISDOR_URL at (recommended — respects ToS,
//      no scraping). Column mapping is a TODO pending the real file headers.
//   2) (Disabled) Direct page scraping — intentionally NOT implemented to avoid
//      violating Terms of Service / robots.txt.
//
// Until BI_JISDOR_URL is set, this adapter reports itself as not configured and
// the runner falls back to mock USD/IDR data.
// =============================================================================

import { parse } from "csv-parse/sync";
import {
  type DataSourceAdapter,
  type RawDataResult,
  type NormalizedRecord,
  type NormalizedExchangeRate,
  SourceNotConfiguredError,
  RateLimiter,
  USER_AGENT,
} from "./types";

const limiter = new RateLimiter(1500);

export class BankIndonesiaSource implements DataSourceAdapter {
  readonly sourceName = "bank-indonesia";
  readonly kind = "exchange_rate" as const;

  private get url(): string | undefined {
    return process.env.BI_JISDOR_URL;
  }

  async fetchLatest(): Promise<RawDataResult> {
    if (!this.url) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "BI_JISDOR_URL not set",
      );
    }

    await limiter.wait();
    const res = await fetch(this.url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(
        `Bank Indonesia fetch failed: ${res.status} ${res.statusText}`,
      );
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

    const out: NormalizedExchangeRate[] = [];

    // TODO: confirm JISDOR CSV headers (typically a date column and a rate
    // column). Map them here. Placeholder loop yields nothing until implemented,
    // so the runner falls back to mock.
    for (const _row of rows) {
      void _row;
      // Intended output once headers are known:
      //   out.push({
      //     kind: "exchange_rate",
      //     pair: "USD/IDR",
      //     date: toIso(row["Date"]),
      //     rate: parseIndonesianNumber(row["Kurs"]),
      //     source: "Bank Indonesia JISDOR",
      //   });
    }

    if (out.length === 0) {
      throw new SourceNotConfiguredError(
        this.sourceName,
        "JISDOR CSV column mapping not implemented yet (see TODO in bank-indonesia.ts)",
      );
    }
    return out;
  }
}
