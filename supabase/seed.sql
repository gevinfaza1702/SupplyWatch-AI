-- =============================================================================
-- SupplyWatch AI — Seed / Demo Data (Phase 2)
--
-- ⚠️ DEMO DATA. These are plausible but synthetic values for development and
-- portfolio demos. They do NOT represent real market prices. Replace with the
-- data-import layer (Phase 4) for real numbers.
--
-- Idempotent: safe to re-run. Uses ON CONFLICT upserts and recomputes MoM/YoY.
-- Run AFTER 001_initial_schema.sql (RLS does not block the service-role / SQL
-- editor, so this works regardless of 002).
--
-- Time range: 13 monthly points ending 2025-06-01 so YoY (12 months back) is
-- available for the latest 1 point and MoM for all but the first.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Commodities (7 — 6 required + cocoa)
-- -----------------------------------------------------------------------------
insert into public.commodities (name, slug, category, unit, source, description) values
  ('Gula (Sugar)',          'sugar',         'Sweetener',  'USD/lb',         'Demo Seed', 'Harga gula global. Bahan utama bakery, coffee shop, dan minuman.'),
  ('Gandum (Wheat/Cereal)', 'wheat',         'Grain',      'Index (2014=100)', 'Demo Seed', 'Indeks serealia. Penentu biaya tepung untuk roti dan kue.'),
  ('Kopi (Coffee)',         'coffee',        'Beverage',   'USD/lb',         'Demo Seed', 'Harga kopi global (arabika). Cost driver utama coffee shop.'),
  ('Susu/Dairy',            'dairy',         'Dairy',      'Index (2014=100)', 'Demo Seed', 'Indeks produk susu. Penting untuk latte, kue, dan pastry.'),
  ('Minyak Nabati (Veg Oil)','vegetable_oil','Oil',        'Index (2014=100)', 'Demo Seed', 'Indeks minyak nabati. Bahan menggoreng dan baking.'),
  ('Minyak Mentah (Crude Oil)','crude_oil',  'Energy',     'USD/bbl',        'Demo Seed', 'Harga minyak mentah. Memengaruhi biaya logistik dan kemasan.'),
  ('Kakao (Cocoa)',         'cocoa',         'Beverage',   'USD/tonne',      'Demo Seed', 'Harga kakao global. Bahan cokelat untuk bakery dan minuman.')
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category,
      unit = excluded.unit,
      source = excluded.source,
      description = excluded.description;

-- -----------------------------------------------------------------------------
-- 2) Commodity prices — 13 monthly points per commodity.
--    Raw `value` only here; MoM/YoY are computed in step 5.
--    Months: 2024-06-01 .. 2025-06-01
-- -----------------------------------------------------------------------------
-- Helper CTE pattern: insert via a values list joined to each commodity slug.
-- generate_series gives the month offsets; per-commodity base + trend + wobble
-- produces realistic-looking series. Deterministic (no random()).

insert into public.commodity_prices (commodity_id, price_date, value, currency, unit, source)
select
  c.id,
  (date '2024-06-01' + (m.n || ' months')::interval)::date as price_date,
  round(
    (s.base
      * (1 + s.trend * m.n)                              -- gentle linear trend
      + s.base * 0.04 * sin(m.n::numeric)                -- monthly wobble
    )::numeric, 2) as value,
  s.currency,
  c.unit,
  'Demo Seed'
from public.commodities c
join (values
  -- slug,          base,    trend,   currency
  ('sugar',         0.21,    0.006,   'USD'),
  ('wheat',         118.0,   0.004,   'USD'),
  ('coffee',        1.85,    0.012,   'USD'),
  ('dairy',         122.0,   0.003,   'USD'),
  ('vegetable_oil', 128.0,   0.007,   'USD'),
  ('crude_oil',     78.0,    0.005,   'USD'),
  ('cocoa',         3200.0,  0.020,   'USD')
) as s(slug, base, trend, currency) on s.slug = c.slug
cross join generate_series(0, 12) as m(n)
on conflict (commodity_id, price_date) do update
  set value = excluded.value,
      currency = excluded.currency,
      unit = excluded.unit,
      source = excluded.source;

-- -----------------------------------------------------------------------------
-- 3) Exchange rates — USD/IDR, 13 monthly points (gently weakening rupiah)
-- -----------------------------------------------------------------------------
insert into public.exchange_rates (rate_date, pair, rate, source)
select
  (date '2024-06-01' + (m.n || ' months')::interval)::date,
  'USD/IDR',
  round((15800 + 45.0 * m.n + 120 * sin(m.n::numeric))::numeric, 0),
  'Demo Seed (JISDOR-style)'
from generate_series(0, 12) as m(n)
on conflict (pair, rate_date) do update
  set rate = excluded.rate,
      source = excluded.source;

-- -----------------------------------------------------------------------------
-- 4) Business commodity weights — Bakery, Coffee Shop, Restaurant
--    weight in [0,1]; importance_label is a coarse bucket.
-- -----------------------------------------------------------------------------
insert into public.business_commodity_weights (business_type, commodity_id, weight, importance_label)
select b.business_type, c.id, b.weight, b.importance
from public.commodities c
join (values
  -- business_type, slug,           weight, importance
  ('bakery',        'wheat',         0.90,  'high'),
  ('bakery',        'sugar',         0.70,  'high'),
  ('bakery',        'dairy',         0.55,  'medium'),
  ('bakery',        'vegetable_oil', 0.50,  'medium'),
  ('bakery',        'cocoa',         0.40,  'medium'),
  ('bakery',        'crude_oil',     0.20,  'low'),
  ('bakery',        'coffee',        0.10,  'low'),

  ('coffee_shop',   'coffee',        0.95,  'high'),
  ('coffee_shop',   'dairy',         0.80,  'high'),
  ('coffee_shop',   'sugar',         0.55,  'medium'),
  ('coffee_shop',   'cocoa',         0.45,  'medium'),
  ('coffee_shop',   'crude_oil',     0.20,  'low'),
  ('coffee_shop',   'wheat',         0.25,  'low'),
  ('coffee_shop',   'vegetable_oil', 0.15,  'low'),

  ('restaurant',    'vegetable_oil', 0.80,  'high'),
  ('restaurant',    'wheat',         0.55,  'medium'),
  ('restaurant',    'sugar',         0.45,  'medium'),
  ('restaurant',    'dairy',         0.45,  'medium'),
  ('restaurant',    'crude_oil',     0.35,  'medium'),
  ('restaurant',    'coffee',        0.20,  'low'),
  ('restaurant',    'cocoa',         0.15,  'low')
) as b(business_type, slug, weight, importance) on b.slug = c.slug
on conflict (business_type, commodity_id) do update
  set weight = excluded.weight,
      importance_label = excluded.importance_label;

-- -----------------------------------------------------------------------------
-- 5) Compute MoM and YoY change ratios for every price point.
--    MoM = value / prev_month - 1 ; YoY = value / value_12_months_ago - 1.
--    Stored as ratios (0.08 = +8%).
-- -----------------------------------------------------------------------------
with prev as (
  select
    cp.id,
    cp.value,
    lag(cp.value) over (
      partition by cp.commodity_id order by cp.price_date
    ) as prev_month_value,
    (
      select p2.value
      from public.commodity_prices p2
      where p2.commodity_id = cp.commodity_id
        and p2.price_date = (cp.price_date - interval '12 months')::date
      limit 1
    ) as year_ago_value
  from public.commodity_prices cp
)
update public.commodity_prices cp
set
  mom_change = case
    when prev.prev_month_value is not null and prev.prev_month_value <> 0
    then round((cp.value / prev.prev_month_value - 1)::numeric, 4)
    else null end,
  yoy_change = case
    when prev.year_ago_value is not null and prev.year_ago_value <> 0
    then round((cp.value / prev.year_ago_value - 1)::numeric, 4)
    else null end
from prev
where prev.id = cp.id;

-- =============================================================================
-- Done. Quick verification queries (optional — run manually):
--   select slug, count(*) from public.commodities c
--     join public.commodity_prices p on p.commodity_id = c.id group by slug;
--   select pair, count(*) from public.exchange_rates group by pair;
--   select business_type, count(*) from public.business_commodity_weights
--     group by business_type;
-- =============================================================================
