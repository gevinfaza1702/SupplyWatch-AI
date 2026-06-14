// =============================================================================
// SupplyWatch AI — Mock data source (Phase 3 fallback)
//
// ⚠️ DEMO DATA. Plausible but synthetic. Used when Supabase is not configured
// or returns no rows, so the dashboard always renders. Mirrors the shape of
// supabase/seed.sql. The full adapter (DataSourceAdapter) arrives in Phase 4.
// =============================================================================

import type { CommodityRow, CommodityPriceRow } from "@/types/database";
import type {
  DataSourceAdapter,
  RawDataResult,
  NormalizedRecord,
  NormalizedCommodityPrice,
  NormalizedExchangeRate,
} from "./types";

type MockSpec = {
  name: string;
  slug: string;
  category: string;
  unit: string;
  description: string;
  base: number;
  trend: number;
  currency: string;
};

const SPECS: MockSpec[] = [
  { name: "Gula (Sugar)", slug: "sugar", category: "Sweetener", unit: "USD/lb", base: 0.21, trend: 0.006, currency: "USD", description: "Harga gula global. Bahan utama bakery, minuman, dan toko sembako." },
  { name: "Gandum (Wheat/Cereal)", slug: "wheat", category: "Grain", unit: "Index (2014=100)", base: 118, trend: 0.004, currency: "USD", description: "Indeks serealia. Penentu biaya tepung untuk roti, mie, dan gorengan." },
  { name: "Kopi (Coffee)", slug: "coffee", category: "Beverage", unit: "USD/lb", base: 1.85, trend: 0.012, currency: "USD", description: "Harga kopi global (arabika). Cost driver utama kedai kopi dan minuman." },
  { name: "Susu/Dairy", slug: "dairy", category: "Dairy", unit: "Index (2014=100)", base: 122, trend: 0.003, currency: "USD", description: "Indeks produk susu. Penting untuk latte, kue, pastry, dan minuman." },
  { name: "Minyak Nabati (Veg Oil)", slug: "vegetable_oil", category: "Oil", unit: "Index (2014=100)", base: 128, trend: 0.007, currency: "USD", description: "Indeks minyak nabati. Bahan menggoreng, baking, dan masakan harian." },
  { name: "Minyak Mentah (Crude Oil)", slug: "crude_oil", category: "Energy", unit: "USD/bbl", base: 78, trend: 0.005, currency: "USD", description: "Harga minyak mentah. Memengaruhi biaya logistik dan kemasan." },
  { name: "Kakao (Cocoa)", slug: "cocoa", category: "Beverage", unit: "USD/tonne", base: 3200, trend: 0.02, currency: "USD", description: "Harga kakao global. Bahan cokelat untuk bakery dan minuman." },
  { name: "Beras (Rice)", slug: "rice", category: "Staple", unit: "IDR/kg", base: 13500, trend: 0.005, currency: "IDR", description: "Harga beras lokal. Bahan pokok warung makan, katering, dan toko sembako." },
  { name: "Telur Ayam (Eggs)", slug: "eggs", category: "Protein", unit: "IDR/kg", base: 29000, trend: 0.007, currency: "IDR", description: "Harga telur ayam. Bahan penting untuk bakery, warung makan, dan katering." },
  { name: "Daging Ayam (Chicken)", slug: "chicken", category: "Protein", unit: "IDR/kg", base: 38000, trend: 0.006, currency: "IDR", description: "Harga daging ayam. Cost driver untuk warung makan, katering, dan restoran." },
  { name: "Daging Sapi (Beef)", slug: "beef", category: "Protein", unit: "IDR/kg", base: 135000, trend: 0.004, currency: "IDR", description: "Harga daging sapi. Bahan protein bernilai tinggi untuk restoran dan katering." },
  { name: "Kedelai (Soybean)", slug: "soybean", category: "Legume", unit: "USD/tonne", base: 520, trend: 0.006, currency: "USD", description: "Harga kedelai. Bahan utama tahu, tempe, susu kedelai, dan snack." },
  { name: "Jagung (Corn)", slug: "corn", category: "Grain", unit: "USD/tonne", base: 210, trend: 0.004, currency: "USD", description: "Harga jagung. Relevan untuk snack, pakan, dan bahan olahan." },
  { name: "Cabai (Chili)", slug: "chili", category: "Spice", unit: "IDR/kg", base: 45000, trend: 0.018, currency: "IDR", description: "Harga cabai lokal. Sangat sensitif untuk warung makan, katering, dan sambal." },
  { name: "Bawang Merah (Shallot)", slug: "shallot", category: "Spice", unit: "IDR/kg", base: 36000, trend: 0.012, currency: "IDR", description: "Harga bawang merah. Bumbu utama masakan Indonesia." },
  { name: "Bawang Putih (Garlic)", slug: "garlic", category: "Spice", unit: "IDR/kg", base: 34000, trend: 0.009, currency: "IDR", description: "Harga bawang putih. Bumbu dasar restoran, warung, dan katering." },
  { name: "Kemasan (Packaging)", slug: "packaging", category: "Packaging", unit: "Index (2024=100)", base: 100, trend: 0.006, currency: "IDR", description: "Indeks biaya kemasan. Relevan untuk minuman, katering, takeaway, dan retail." },
  { name: "LPG / Gas Masak", slug: "lpg", category: "Energy", unit: "IDR/kg", base: 18000, trend: 0.005, currency: "IDR", description: "Harga LPG/gas masak. Biaya operasional dapur dan produksi harian." },
];

const MONTHS = 13; // 2024-06 .. 2025-06, matching the seed
const FIRST_MONTH = new Date(Date.UTC(2024, 5, 1)); // June 2024

function monthDate(n: number): string {
  const d = new Date(FIRST_MONTH);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Same formula as seed.sql so mock and real data look identical. */
function rawValue(spec: MockSpec, n: number): number {
  const v = spec.base * (1 + spec.trend * n) + spec.base * 0.04 * Math.sin(n);
  return Math.round(v * 100) / 100;
}

let cachedCommodities: CommodityRow[] | null = null;
let cachedPrices: CommodityPriceRow[] | null = null;

export function getMockCommodities(): CommodityRow[] {
  if (cachedCommodities) return cachedCommodities;
  const now = new Date().toISOString();
  cachedCommodities = SPECS.map((s, i) => ({
    id: `mock-commodity-${i + 1}`,
    name: s.name,
    slug: s.slug,
    category: s.category,
    unit: s.unit,
    source: "Demo Seed (mock)",
    description: s.description,
    created_at: now,
    updated_at: now,
  }));
  return cachedCommodities;
}

export function getMockPrices(): CommodityPriceRow[] {
  if (cachedPrices) return cachedPrices;
  const now = new Date().toISOString();
  const rows: CommodityPriceRow[] = [];

  SPECS.forEach((spec, ci) => {
    const values = Array.from({ length: MONTHS }, (_, n) => rawValue(spec, n));
    for (let n = 0; n < MONTHS; n++) {
      const prev = n > 0 ? values[n - 1] : null;
      const yearAgo = n >= 12 ? values[n - 12] : null;
      rows.push({
        id: `mock-price-${ci + 1}-${n}`,
        commodity_id: `mock-commodity-${ci + 1}`,
        price_date: monthDate(n),
        value: values[n],
        currency: spec.currency,
        unit: spec.unit,
        mom_change:
          prev && prev !== 0 ? round4(values[n] / prev - 1) : null,
        yoy_change:
          yearAgo && yearAgo !== 0 ? round4(values[n] / yearAgo - 1) : null,
        source: "Demo Seed (mock)",
        created_at: now,
      });
    }
  });

  cachedPrices = rows;
  return rows;
}

/** Mock USD/IDR series matching the seed's gently weakening rupiah. */
export function getMockExchangeRates(): Array<{
  rate_date: string;
  pair: string;
  rate: number;
}> {
  return Array.from({ length: MONTHS }, (_, n) => ({
    rate_date: monthDate(n),
    pair: "USD/IDR",
    rate: Math.round(15800 + 45 * n + 120 * Math.sin(n)),
  }));
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

// =============================================================================
// Adapters (Phase 4) — wrap the mock generators in the DataSourceAdapter
// contract so the import runner can persist them like any real source.
// =============================================================================

/** Mock commodity-price adapter. Always works offline — the dev default. */
export class MockCommoditySource implements DataSourceAdapter {
  readonly sourceName = "mock-commodities";
  readonly kind = "commodity_price" as const;

  async fetchLatest(): Promise<RawDataResult> {
    return {
      payload: { commodities: getMockCommodities(), prices: getMockPrices() },
      fetchedFrom: "in-memory mock generator",
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(raw: RawDataResult): Promise<NormalizedRecord[]> {
    const { commodities, prices } = raw.payload as {
      commodities: CommodityRow[];
      prices: CommodityPriceRow[];
    };
    const slugById = new Map(commodities.map((c) => [c.id, c.slug]));

    return prices.map<NormalizedCommodityPrice>((p) => ({
      kind: "commodity_price",
      commoditySlug: slugById.get(p.commodity_id) ?? "unknown",
      date: p.price_date,
      value: p.value,
      currency: p.currency ?? "USD",
      unit: p.unit ?? "",
      source: "Demo Seed (mock)",
      metadata: { momChange: p.mom_change, yoyChange: p.yoy_change },
    }));
  }
}

/** Mock USD/IDR adapter. */
export class MockExchangeRateSource implements DataSourceAdapter {
  readonly sourceName = "mock-exchange-rates";
  readonly kind = "exchange_rate" as const;

  async fetchLatest(): Promise<RawDataResult> {
    return {
      payload: getMockExchangeRates(),
      fetchedFrom: "in-memory mock generator",
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(raw: RawDataResult): Promise<NormalizedRecord[]> {
    const rows = raw.payload as Array<{
      rate_date: string;
      pair: string;
      rate: number;
    }>;
    return rows.map<NormalizedExchangeRate>((r) => ({
      kind: "exchange_rate",
      pair: r.pair,
      date: r.rate_date,
      rate: r.rate,
      source: "Demo Seed (mock)",
    }));
  }
}
