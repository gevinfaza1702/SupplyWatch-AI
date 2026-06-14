-- =============================================================================
-- 005 — Expand business types for broader Indonesian UMKM coverage.
--
-- Run before re-running seed.sql so new business_commodity_weights rows pass
-- check constraints on existing Supabase projects.
-- New commodity rows themselves are inserted by seed.sql; the commodities table
-- does not need a slug check-constraint update.
-- =============================================================================

alter table public.profiles
  drop constraint if exists profiles_business_type_check;

alter table public.profiles
  add constraint profiles_business_type_check
  check (
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
  );

alter table public.business_commodity_weights
  drop constraint if exists business_commodity_weights_business_type_check;

alter table public.business_commodity_weights
  add constraint business_commodity_weights_business_type_check
  check (
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
  );

alter table public.risk_scores
  drop constraint if exists risk_scores_business_type_check;

alter table public.risk_scores
  add constraint risk_scores_business_type_check
  check (
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
  );
