-- =============================================================================
-- SupplyWatch AI — Row Level Security (Phase 2)
--
-- Strategy:
--   * USER-SCOPED tables (profiles, ai_insights, simulation_results, reports):
--       a user may read/write ONLY their own rows. Enforced by auth.uid().
--   * PUBLIC/SHARED data (commodities, commodity_prices, exchange_rates,
--       business_commodity_weights, risk_scores):
--       any authenticated user may READ. Writes are performed only by the
--       service-role key (which bypasses RLS), so no write policy is granted to
--       normal users.
--   * data_import_logs: no policy for normal users — service-role only.
--
-- Note: the service-role key bypasses RLS entirely. These policies govern the
-- anon/authenticated clients used in the browser and in user-session server code.
--
-- Idempotent: every policy is dropped (if present) before being recreated, so
-- this file is safe to re-run.
-- =============================================================================

-- Enable RLS on every table.
alter table public.profiles                    enable row level security;
alter table public.commodities                 enable row level security;
alter table public.commodity_prices            enable row level security;
alter table public.exchange_rates              enable row level security;
alter table public.business_commodity_weights  enable row level security;
alter table public.risk_scores                 enable row level security;
alter table public.ai_insights                 enable row level security;
alter table public.simulation_results          enable row level security;
alter table public.reports                     enable row level security;
alter table public.data_import_logs            enable row level security;

-- -----------------------------------------------------------------------------
-- profiles — owner can do everything to their own row
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- ai_insights — owner-only
-- -----------------------------------------------------------------------------
drop policy if exists "ai_insights_select_own" on public.ai_insights;
create policy "ai_insights_select_own"
  on public.ai_insights for select
  using (auth.uid() = user_id);

drop policy if exists "ai_insights_insert_own" on public.ai_insights;
create policy "ai_insights_insert_own"
  on public.ai_insights for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_insights_update_own" on public.ai_insights;
create policy "ai_insights_update_own"
  on public.ai_insights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_insights_delete_own" on public.ai_insights;
create policy "ai_insights_delete_own"
  on public.ai_insights for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- simulation_results — owner-only
-- -----------------------------------------------------------------------------
drop policy if exists "simulation_results_select_own" on public.simulation_results;
create policy "simulation_results_select_own"
  on public.simulation_results for select
  using (auth.uid() = user_id);

drop policy if exists "simulation_results_insert_own" on public.simulation_results;
create policy "simulation_results_insert_own"
  on public.simulation_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "simulation_results_update_own" on public.simulation_results;
create policy "simulation_results_update_own"
  on public.simulation_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "simulation_results_delete_own" on public.simulation_results;
create policy "simulation_results_delete_own"
  on public.simulation_results for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- reports — owner-only
-- -----------------------------------------------------------------------------
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own"
  on public.reports for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- PUBLIC/SHARED read-only data — readable by anon AND authenticated, so the
-- demo dashboard works WITHOUT login. These tables hold no personal data.
-- (No insert/update/delete policy => only the service-role key can write.)
-- -----------------------------------------------------------------------------
drop policy if exists "commodities_read" on public.commodities;
create policy "commodities_read"
  on public.commodities for select
  to anon, authenticated
  using (true);

drop policy if exists "commodity_prices_read" on public.commodity_prices;
create policy "commodity_prices_read"
  on public.commodity_prices for select
  to anon, authenticated
  using (true);

drop policy if exists "exchange_rates_read" on public.exchange_rates;
create policy "exchange_rates_read"
  on public.exchange_rates for select
  to anon, authenticated
  using (true);

drop policy if exists "business_commodity_weights_read" on public.business_commodity_weights;
create policy "business_commodity_weights_read"
  on public.business_commodity_weights for select
  to anon, authenticated
  using (true);

drop policy if exists "risk_scores_read" on public.risk_scores;
create policy "risk_scores_read"
  on public.risk_scores for select
  to anon, authenticated
  using (true);

-- data_import_logs: intentionally NO policy for normal users.
-- Only the service-role key (which bypasses RLS) reads/writes it.
