// =============================================================================
// SupplyWatch AI — Data source adapter contract (Phase 4)
//
// Adapter pattern: each source (mock, World Bank, FAO, Bank Indonesia) conforms
// to DataSourceAdapter so the import runner treats them uniformly and sources
// can be swapped without touching the pipeline.
// =============================================================================

/** What kind of records an adapter emits. */
export type DataKind = "commodity_price" | "exchange_rate";

/** Raw, unprocessed result fetched from a source (before normalization). */
export interface RawDataResult {
  /** Free-form payload — CSV text, parsed rows, JSON, etc. */
  payload: unknown;
  /** Where it came from, for logging/audit. */
  fetchedFrom: string;
  fetchedAt: string; // ISO
}

/** A normalized commodity price point, ready to upsert into commodity_prices. */
export interface NormalizedCommodityPrice {
  kind: "commodity_price";
  commoditySlug: string;
  date: string; // ISO date (YYYY-MM-DD)
  value: number;
  currency: string;
  unit: string;
  source: string;
  metadata?: Record<string, unknown>;
}

/** A normalized exchange-rate point, ready to upsert into exchange_rates. */
export interface NormalizedExchangeRate {
  kind: "exchange_rate";
  pair: string; // e.g. "USD/IDR"
  date: string; // ISO date
  rate: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export type NormalizedRecord =
  | NormalizedCommodityPrice
  | NormalizedExchangeRate;

/**
 * The contract every data source implements.
 *
 * Keep `fetchLatest` side-effect free (no DB writes) — the import runner owns
 * persistence and logging. Adapters should fail loudly with a clear Error so
 * the runner can record it in data_import_logs and (optionally) fall back.
 */
export interface DataSourceAdapter {
  /** Stable identifier, also written to data_import_logs.source. */
  readonly sourceName: string;
  /** What this adapter produces. */
  readonly kind: DataKind;
  /** Fetch raw data from the source. */
  fetchLatest(): Promise<RawDataResult>;
  /** Turn raw data into normalized records. */
  normalize(raw: RawDataResult): Promise<NormalizedRecord[]>;
}

/** Outcome of running a single adapter through the pipeline. */
export interface ImportResult {
  source: string;
  status: "success" | "error";
  recordsImported: number;
  usedFallback: boolean;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
}

/**
 * Thrown by a real adapter when it has no configured URL/dataset yet. The
 * import runner treats this as "not ready" and falls back to mock instead of
 * recording a hard error.
 */
export class SourceNotConfiguredError extends Error {
  constructor(source: string, detail?: string) {
    super(
      `Source "${source}" is not configured${detail ? `: ${detail}` : ""}. ` +
        `Set its *_URL env var to enable real data (see .env.example).`,
    );
    this.name = "SourceNotConfiguredError";
  }
}

/** A polite default User-Agent for any real HTTP fetches. */
export const USER_AGENT =
  "SupplyWatchAI/0.1 (+https://supplywatch.example; portfolio demo; contact: admin@example.com)";

/**
 * Minimal, dependency-free rate limiter: ensures at least `minIntervalMs`
 * between calls. Real adapters should route fetches through this to respect
 * source rate limits and avoid aggressive scraping.
 */
export class RateLimiter {
  private last = 0;
  constructor(private readonly minIntervalMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.last;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.last = Date.now();
  }
}
