-- =============================================================================
-- SupplyWatch AI — AI Insight payload fields (Phase 6)
--
-- Store the full structured insight returned by the AI generator so
-- /api/insights/latest and /insights can render the same payload later.
-- =============================================================================

alter table public.ai_insights
  add column if not exists main_drivers jsonb,
  add column if not exists disclaimer text,
  add column if not exists is_fallback boolean not null default false;
