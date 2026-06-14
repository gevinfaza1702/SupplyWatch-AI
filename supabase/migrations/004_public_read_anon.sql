-- =============================================================================
-- 004 — Allow anon (logged-out) reads of public/shared data so the demo
-- dashboard works without login. Re-runnable.
-- Run this in Supabase SQL Editor (or `supabase db push`).
-- =============================================================================

drop policy if exists "commodities_read" on public.commodities;
create policy "commodities_read"
  on public.commodities for select to anon, authenticated using (true);

drop policy if exists "commodity_prices_read" on public.commodity_prices;
create policy "commodity_prices_read"
  on public.commodity_prices for select to anon, authenticated using (true);

drop policy if exists "exchange_rates_read" on public.exchange_rates;
create policy "exchange_rates_read"
  on public.exchange_rates for select to anon, authenticated using (true);

drop policy if exists "business_commodity_weights_read" on public.business_commodity_weights;
create policy "business_commodity_weights_read"
  on public.business_commodity_weights for select to anon, authenticated using (true);

drop policy if exists "risk_scores_read" on public.risk_scores;
create policy "risk_scores_read"
  on public.risk_scores for select to anon, authenticated using (true);
