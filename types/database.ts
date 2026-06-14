// =============================================================================
// SupplyWatch AI — Database types (Phase 2)
//
// Hand-authored to match supabase/migrations/001_initial_schema.sql.
// You can later regenerate this with the Supabase CLI:
//   supabase gen types typescript --project-id <ref> --schema public > types/database.ts
// =============================================================================

/** Postgres jsonb maps to this recursive JSON type (Supabase convention). */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessType = "bakery" | "coffee_shop" | "restaurant";
export type RiskLevel = "Low" | "Medium" | "High";
export type ImportanceLabel = "low" | "medium" | "high";
export type RestockFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type ImportStatus = "running" | "success" | "error";

/** A single action item inside an AI insight's action_plan. */
export type ActionPlanItem = {
  action: string;
  priority: RiskLevel;
  reason: string;
};

/** Ratio map of ingredient -> share of cost, e.g. { wheat: 0.6, sugar: 0.2 }. */
export type IngredientMix = Record<string, number>;

// -----------------------------------------------------------------------------
// Row types (shape returned by SELECT *)
// -----------------------------------------------------------------------------

export type ProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  business_type: BusinessType | null;
  location: string | null;
  target_margin: number | null;
  monthly_raw_material_budget: number | null;
  restock_frequency: RestockFrequency | null;
  created_at: string;
  updated_at: string;
}

export type CommodityRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  unit: string | null;
  source: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type CommodityPriceRow = {
  id: string;
  commodity_id: string;
  price_date: string; // ISO date
  value: number;
  currency: string | null;
  unit: string | null;
  mom_change: number | null; // ratio, 0.08 = +8%
  yoy_change: number | null; // ratio
  source: string | null;
  created_at: string;
}

export type ExchangeRateRow = {
  id: string;
  rate_date: string;
  pair: string;
  rate: number;
  source: string | null;
  created_at: string;
}

export type BusinessCommodityWeightRow = {
  id: string;
  business_type: BusinessType;
  commodity_id: string;
  weight: number; // 0..1
  importance_label: ImportanceLabel | null;
  created_at: string;
}

export type RiskScoreRow = {
  id: string;
  commodity_id: string;
  business_type: BusinessType | null;
  period: string;
  score: number | null;
  risk_level: RiskLevel | null;
  reason: string | null;
  recommendation: string | null;
  created_at: string;
}

export type AiInsightRow = {
  id: string;
  user_id: string;
  business_type: string | null;
  period: string | null;
  input_snapshot: Json | null;
  summary: string | null;
  impact_analysis: string | null;
  main_drivers: Json | null;
  recommendation: string | null;
  action_plan: Json | null;
  risk_level: RiskLevel | null;
  confidence_score: number | null;
  disclaimer: string | null;
  is_fallback: boolean;
  created_at: string;
}

export type SimulationResultRow = {
  id: string;
  user_id: string;
  product_name: string | null;
  selling_price: number | null;
  current_cost: number | null;
  target_margin: number | null;
  ingredient_mix: Json | null;
  estimated_new_cost: number | null;
  estimated_new_margin: number | null;
  recommended_price: number | null;
  ai_explanation: string | null;
  created_at: string;
}

export type ReportRow = {
  id: string;
  user_id: string;
  title: string | null;
  period: string | null;
  content: Json | null;
  pdf_url: string | null;
  created_at: string;
}

export type DataImportLogRow = {
  id: string;
  source: string;
  status: ImportStatus;
  records_imported: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

// -----------------------------------------------------------------------------
// Supabase-style Database interface (Row / Insert / Update per table).
// Insert/Update mark server-defaulted columns optional.
// -----------------------------------------------------------------------------

/**
 * Build an Insert type from a Row: the listed keys become optional, everything
 * else stays required. Produces a single FLAT object type (not an intersection)
 * so the supabase-js `.insert()`/`.upsert()` overloads resolve correctly
 * instead of collapsing to `never`.
 */
type MakeInsert<Row, OptionalKeys extends keyof Row> = {
  [K in keyof Row as K extends OptionalKeys ? never : K]: Row[K];
} & {
  [K in OptionalKeys]?: Row[K];
} extends infer T
  ? { [K in keyof T]: T[K] }
  : never;

type Defaulted = "id" | "created_at" | "updated_at";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: MakeInsert<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      commodities: {
        Row: CommodityRow;
        Insert: MakeInsert<CommodityRow, Defaulted>;
        Update: Partial<CommodityRow>;
        Relationships: [];
      };
      commodity_prices: {
        Row: CommodityPriceRow;
        Insert: MakeInsert<CommodityPriceRow, "id" | "created_at">;
        Update: Partial<CommodityPriceRow>;
        Relationships: [];
      };
      exchange_rates: {
        Row: ExchangeRateRow;
        Insert: MakeInsert<ExchangeRateRow, "id" | "created_at">;
        Update: Partial<ExchangeRateRow>;
        Relationships: [];
      };
      business_commodity_weights: {
        Row: BusinessCommodityWeightRow;
        Insert: MakeInsert<BusinessCommodityWeightRow, "id" | "created_at">;
        Update: Partial<BusinessCommodityWeightRow>;
        Relationships: [];
      };
      risk_scores: {
        Row: RiskScoreRow;
        Insert: MakeInsert<RiskScoreRow, "id" | "created_at">;
        Update: Partial<RiskScoreRow>;
        Relationships: [];
      };
      ai_insights: {
        Row: AiInsightRow;
        Insert: MakeInsert<AiInsightRow, "id" | "created_at">;
        Update: Partial<AiInsightRow>;
        Relationships: [];
      };
      simulation_results: {
        Row: SimulationResultRow;
        Insert: MakeInsert<SimulationResultRow, "id" | "created_at">;
        Update: Partial<SimulationResultRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: MakeInsert<ReportRow, "id" | "created_at">;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      data_import_logs: {
        Row: DataImportLogRow;
        Insert: MakeInsert<
          DataImportLogRow,
          "id" | "started_at" | "records_imported" | "error_message" | "finished_at"
        >;
        Update: Partial<DataImportLogRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
