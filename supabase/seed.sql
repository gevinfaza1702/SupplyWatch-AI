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
-- 1) Commodities (global + local staples for Indonesian UMKM)
-- -----------------------------------------------------------------------------
insert into public.commodities (name, slug, category, unit, source, description) values
  ('Gula (Sugar)',            'sugar',         'Sweetener', 'USD/lb',           'Demo Seed', 'Harga gula global. Bahan utama bakery, minuman, dan toko sembako.'),
  ('Gandum (Wheat/Cereal)',   'wheat',         'Grain',     'Index (2014=100)', 'Demo Seed', 'Indeks serealia. Penentu biaya tepung untuk roti, mie, dan gorengan.'),
  ('Kopi (Coffee)',           'coffee',        'Beverage',  'USD/lb',           'Demo Seed', 'Harga kopi global (arabika). Cost driver utama kedai kopi dan minuman.'),
  ('Susu/Dairy',              'dairy',         'Dairy',     'Index (2014=100)', 'Demo Seed', 'Indeks produk susu. Penting untuk latte, kue, pastry, dan minuman.'),
  ('Minyak Nabati (Veg Oil)', 'vegetable_oil', 'Oil',       'Index (2014=100)', 'Demo Seed', 'Indeks minyak nabati. Bahan menggoreng, baking, dan masakan harian.'),
  ('Minyak Mentah (Crude Oil)','crude_oil',    'Energy',    'USD/bbl',          'Demo Seed', 'Harga minyak mentah. Memengaruhi biaya logistik dan kemasan.'),
  ('Kakao (Cocoa)',           'cocoa',         'Beverage',  'USD/tonne',        'Demo Seed', 'Harga kakao global. Bahan cokelat untuk bakery dan minuman.'),
  ('Beras (Rice)',            'rice',          'Staple',    'IDR/kg',           'Demo Seed', 'Harga beras lokal. Bahan pokok warung makan, katering, dan toko sembako.'),
  ('Telur Ayam (Eggs)',       'eggs',          'Protein',   'IDR/kg',           'Demo Seed', 'Harga telur ayam. Bahan penting untuk bakery, warung makan, dan katering.'),
  ('Daging Ayam (Chicken)',   'chicken',       'Protein',   'IDR/kg',           'Demo Seed', 'Harga daging ayam. Cost driver untuk warung makan, katering, dan restoran.'),
  ('Daging Sapi (Beef)',      'beef',          'Protein',   'IDR/kg',           'Demo Seed', 'Harga daging sapi. Bahan protein bernilai tinggi untuk restoran dan katering.'),
  ('Kedelai (Soybean)',       'soybean',       'Legume',    'USD/tonne',        'Demo Seed', 'Harga kedelai. Bahan utama tahu, tempe, susu kedelai, dan snack.'),
  ('Jagung (Corn)',           'corn',          'Grain',     'USD/tonne',        'Demo Seed', 'Harga jagung. Relevan untuk snack, pakan, dan bahan olahan.'),
  ('Cabai (Chili)',           'chili',         'Spice',     'IDR/kg',           'Demo Seed', 'Harga cabai lokal. Sangat sensitif untuk warung makan, katering, dan sambal.'),
  ('Bawang Merah (Shallot)',  'shallot',       'Spice',     'IDR/kg',           'Demo Seed', 'Harga bawang merah. Bumbu utama masakan Indonesia.'),
  ('Bawang Putih (Garlic)',   'garlic',        'Spice',     'IDR/kg',           'Demo Seed', 'Harga bawang putih. Bumbu dasar restoran, warung, dan katering.'),
  ('Kemasan (Packaging)',     'packaging',     'Packaging', 'Index (2024=100)', 'Demo Seed', 'Indeks biaya kemasan. Relevan untuk minuman, katering, takeaway, dan retail.'),
  ('LPG / Gas Masak',         'lpg',           'Energy',    'IDR/kg',           'Demo Seed', 'Harga LPG/gas masak. Biaya operasional dapur dan produksi harian.')
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
  ('cocoa',         3200.0,  0.020,   'USD'),
  ('rice',          13500.0, 0.005,   'IDR'),
  ('eggs',          29000.0, 0.007,   'IDR'),
  ('chicken',       38000.0, 0.006,   'IDR'),
  ('beef',          135000.0,0.004,   'IDR'),
  ('soybean',       520.0,   0.006,   'USD'),
  ('corn',          210.0,   0.004,   'USD'),
  ('chili',         45000.0, 0.018,   'IDR'),
  ('shallot',       36000.0, 0.012,   'IDR'),
  ('garlic',        34000.0, 0.009,   'IDR'),
  ('packaging',     100.0,   0.006,   'IDR'),
  ('lpg',           18000.0, 0.005,   'IDR')
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
-- 4) Business commodity weights — broader Indonesian UMKM types.
--    weight in [0,1]; importance_label is a coarse bucket.
-- -----------------------------------------------------------------------------
insert into public.business_commodity_weights (business_type, commodity_id, weight, importance_label)
select
  b.business_type,
  c.id,
  b.weight,
  case
    when b.weight >= 0.65 then 'high'
    when b.weight >= 0.35 then 'medium'
    else 'low'
  end as importance
from public.commodities c
join (values
  -- business_type,    slug,           weight
  ('bakery',           'wheat',         0.90),
  ('bakery',           'sugar',         0.75),
  ('bakery',           'dairy',         0.60),
  ('bakery',           'eggs',          0.55),
  ('bakery',           'vegetable_oil', 0.45),
  ('bakery',           'cocoa',         0.40),
  ('bakery',           'packaging',     0.25),
  ('bakery',           'lpg',           0.20),
  ('bakery',           'coffee',        0.10),

  ('coffee_shop',      'coffee',        0.95),
  ('coffee_shop',      'dairy',         0.80),
  ('coffee_shop',      'sugar',         0.55),
  ('coffee_shop',      'cocoa',         0.45),
  ('coffee_shop',      'packaging',     0.30),
  ('coffee_shop',      'lpg',           0.25),
  ('coffee_shop',      'wheat',         0.20),
  ('coffee_shop',      'vegetable_oil', 0.15),

  ('restaurant',       'vegetable_oil', 0.80),
  ('restaurant',       'rice',          0.70),
  ('restaurant',       'chicken',       0.65),
  ('restaurant',       'eggs',          0.55),
  ('restaurant',       'chili',         0.55),
  ('restaurant',       'shallot',       0.45),
  ('restaurant',       'garlic',        0.45),
  ('restaurant',       'beef',          0.40),
  ('restaurant',       'lpg',           0.40),
  ('restaurant',       'wheat',         0.35),
  ('restaurant',       'dairy',         0.20),
  ('restaurant',       'sugar',         0.20),
  ('restaurant',       'packaging',     0.20),

  ('warung_makan',     'rice',          0.90),
  ('warung_makan',     'vegetable_oil', 0.85),
  ('warung_makan',     'eggs',          0.70),
  ('warung_makan',     'chicken',       0.65),
  ('warung_makan',     'chili',         0.65),
  ('warung_makan',     'shallot',       0.50),
  ('warung_makan',     'garlic',        0.50),
  ('warung_makan',     'lpg',           0.45),
  ('warung_makan',     'soybean',       0.35),
  ('warung_makan',     'beef',          0.25),
  ('warung_makan',     'sugar',         0.20),

  ('catering',         'rice',          0.85),
  ('catering',         'chicken',       0.75),
  ('catering',         'vegetable_oil', 0.70),
  ('catering',         'eggs',          0.60),
  ('catering',         'beef',          0.55),
  ('catering',         'packaging',     0.50),
  ('catering',         'lpg',           0.45),
  ('catering',         'chili',         0.45),
  ('catering',         'shallot',       0.40),
  ('catering',         'garlic',        0.40),
  ('catering',         'dairy',         0.25),
  ('catering',         'wheat',         0.25),

  ('beverage_shop',    'sugar',         0.90),
  ('beverage_shop',    'dairy',         0.75),
  ('beverage_shop',    'coffee',        0.55),
  ('beverage_shop',    'cocoa',         0.45),
  ('beverage_shop',    'packaging',     0.50),
  ('beverage_shop',    'lpg',           0.25),
  ('beverage_shop',    'vegetable_oil', 0.05),

  ('fried_snack',      'vegetable_oil', 0.95),
  ('fried_snack',      'wheat',         0.75),
  ('fried_snack',      'soybean',       0.55),
  ('fried_snack',      'corn',          0.50),
  ('fried_snack',      'lpg',           0.45),
  ('fried_snack',      'chili',         0.35),
  ('fried_snack',      'packaging',     0.35),
  ('fried_snack',      'garlic',        0.25),
  ('fried_snack',      'sugar',         0.25),

  ('grocery_retail',   'rice',          0.95),
  ('grocery_retail',   'sugar',         0.80),
  ('grocery_retail',   'vegetable_oil', 0.75),
  ('grocery_retail',   'eggs',          0.70),
  ('grocery_retail',   'soybean',       0.50),
  ('grocery_retail',   'chili',         0.50),
  ('grocery_retail',   'coffee',        0.45),
  ('grocery_retail',   'dairy',         0.45),
  ('grocery_retail',   'shallot',       0.45),
  ('grocery_retail',   'wheat',         0.40),
  ('grocery_retail',   'garlic',        0.40),
  ('grocery_retail',   'lpg',           0.35),
  ('grocery_retail',   'chicken',       0.30),
  ('grocery_retail',   'packaging',     0.25),
  ('grocery_retail',   'beef',          0.25)
) as b(business_type, slug, weight) on b.slug = c.slug
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
