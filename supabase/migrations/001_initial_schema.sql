-- =============================================================================
-- SupplyWatch AI — Initial Schema (Phase 2)
-- Postgres / Supabase
--
-- Run order: 001_initial_schema.sql -> 002_rls_policies.sql -> seed.sql
-- All tables live in the default `public` schema.
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto. It is usually preinstalled on Supabase,
-- but enabling it explicitly makes this migration self-contained.
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared helper: keep `updated_at` fresh on every UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- profiles — one row per authenticated user (business profile)
-- =============================================================================
create table if not exists public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  full_name                   text,
  company_name                text,
  business_type               text check (
                                business_type in (
                                  'bakery',
                                  'coffee_shop',
                                  'restaurant',
                                  'warung_makan',
                                  'catering',
                                  'beverage_shop',
                                  'fried_snack',
                                  'grocery_retail'
                                )
                              ),
  location                    text,
  target_margin               numeric check (target_margin >= 0 and target_margin <= 100),
  monthly_raw_material_budget numeric check (monthly_raw_material_budget >= 0),
  restock_frequency           text check (
                                restock_frequency in ('daily', 'weekly', 'biweekly', 'monthly')
                              ),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- commodities — master list (public/shared data)
-- =============================================================================
create table if not exists public.commodities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  category    text,
  unit        text,
  source      text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_commodities_updated_at
  before update on public.commodities
  for each row execute function public.set_updated_at();

-- =============================================================================
-- commodity_prices — time series of prices/indices per commodity
-- =============================================================================
create table if not exists public.commodity_prices (
  id           uuid primary key default gen_random_uuid(),
  commodity_id uuid not null references public.commodities (id) on delete cascade,
  price_date   date not null,
  value        numeric not null,
  currency     text default 'USD',
  unit         text,
  mom_change   numeric,  -- month-over-month change, as a ratio (0.08 = +8%)
  yoy_change   numeric,  -- year-over-year change, as a ratio
  source       text,
  created_at   timestamptz not null default now(),
  -- one data point per commodity per date
  unique (commodity_id, price_date)
);

-- Primary read path: latest/historical prices for a commodity.
create index if not exists idx_commodity_prices_commodity_date
  on public.commodity_prices (commodity_id, price_date desc);

-- =============================================================================
-- exchange_rates — time series of currency pairs (e.g. USD/IDR via JISDOR)
-- =============================================================================
create table if not exists public.exchange_rates (
  id         uuid primary key default gen_random_uuid(),
  rate_date  date not null,
  pair       text not null default 'USD/IDR',
  rate       numeric not null check (rate > 0),
  source     text,
  created_at timestamptz not null default now(),
  unique (pair, rate_date)
);

create index if not exists idx_exchange_rates_date
  on public.exchange_rates (rate_date desc);

-- =============================================================================
-- business_commodity_weights — how important a commodity is per business type
-- =============================================================================
create table if not exists public.business_commodity_weights (
  id               uuid primary key default gen_random_uuid(),
  business_type    text not null check (
                     business_type in (
                       'bakery',
                       'coffee_shop',
                       'restaurant',
                       'warung_makan',
                       'catering',
                       'beverage_shop',
                       'fried_snack',
                       'grocery_retail'
                     )
                   ),
  commodity_id     uuid not null references public.commodities (id) on delete cascade,
  weight           numeric not null check (weight >= 0 and weight <= 1),
  importance_label text check (importance_label in ('low', 'medium', 'high')),
  created_at       timestamptz not null default now(),
  unique (business_type, commodity_id)
);

create index if not exists idx_bcw_business_type
  on public.business_commodity_weights (business_type);

-- =============================================================================
-- risk_scores — output of the Risk Engine (Phase 5), shared/public read
-- =============================================================================
create table if not exists public.risk_scores (
  id             uuid primary key default gen_random_uuid(),
  commodity_id   uuid not null references public.commodities (id) on delete cascade,
  business_type  text check (
                   business_type in (
                     'bakery',
                     'coffee_shop',
                     'restaurant',
                     'warung_makan',
                     'catering',
                     'beverage_shop',
                     'fried_snack',
                     'grocery_retail'
                   )
                 ),
  period         text not null,  -- e.g. '2025-W24' or '2025-06'
  score          numeric check (score >= 0 and score <= 100),
  risk_level     text check (risk_level in ('Low', 'Medium', 'High')),
  reason         text,
  recommendation text,
  created_at     timestamptz not null default now(),
  unique (commodity_id, business_type, period)
);

create index if not exists idx_risk_scores_business_period
  on public.risk_scores (business_type, period);

-- =============================================================================
-- ai_insights — per-user AI impact analysis (user-scoped)
-- =============================================================================
create table if not exists public.ai_insights (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  business_type    text,
  period           text,
  input_snapshot   jsonb,  -- exact inputs sent to the AI, for reproducibility
  summary          text,
  impact_analysis  text,
  recommendation   text,
  action_plan      jsonb,  -- [{ action, priority, reason }, ...]
  risk_level       text check (risk_level in ('Low', 'Medium', 'High')),
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 100),
  created_at       timestamptz not null default now()
);

create index if not exists idx_ai_insights_user_created
  on public.ai_insights (user_id, created_at desc);

-- =============================================================================
-- simulation_results — saved cost-impact simulations (user-scoped)
-- =============================================================================
create table if not exists public.simulation_results (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  product_name          text,
  selling_price         numeric check (selling_price >= 0),
  current_cost          numeric check (current_cost >= 0),
  target_margin         numeric,
  ingredient_mix        jsonb,  -- { sugar: 0.2, wheat: 0.6, ... }
  estimated_new_cost    numeric,
  estimated_new_margin  numeric,
  recommended_price     numeric,
  ai_explanation        text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_simulation_results_user_created
  on public.simulation_results (user_id, created_at desc);

-- =============================================================================
-- reports — generated weekly reports (user-scoped)
-- =============================================================================
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,
  period     text,
  content    jsonb,  -- structured report body
  pdf_url    text,   -- Supabase Storage URL, if generated
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_user_created
  on public.reports (user_id, created_at desc);

-- =============================================================================
-- data_import_logs — audit trail for data-source imports (Phase 4)
-- =============================================================================
create table if not exists public.data_import_logs (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  status            text not null check (status in ('running', 'success', 'error')),
  records_imported  int default 0,
  error_message     text,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz
);

create index if not exists idx_data_import_logs_started
  on public.data_import_logs (started_at desc);
