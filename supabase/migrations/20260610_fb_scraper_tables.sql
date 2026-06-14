-- Migration: Facebook Price Scraper Tables
-- Created: 2026-06-10
-- Purpose: Support scraping harga domba (and other ternak) dari Facebook posts via Apify

-- ── 1. fb_scraper_sources ────────────────────────────────────────────────────
-- Stores the list of Facebook page/group URLs to scrape
CREATE TABLE IF NOT EXISTS public.fb_scraper_sources (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url      TEXT        NOT NULL,
  page_name     TEXT,
  komoditas     TEXT        NOT NULL DEFAULT 'domba',   -- domba | sapi | broiler | kambing
  region        TEXT        NOT NULL DEFAULT 'nasional',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. fb_scraper_runs ───────────────────────────────────────────────────────
-- One row per scraper invocation (manual or scheduled)
CREATE TABLE IF NOT EXISTS public.fb_scraper_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  apify_run_id        TEXT,                             -- Apify actor run ID
  komoditas           TEXT        NOT NULL DEFAULT 'domba',
  source_ids          UUID[]      DEFAULT '{}',          -- which sources were targeted
  status              TEXT        NOT NULL DEFAULT 'pending',  -- pending | running | success | error | dry_run
  posts_fetched       INTEGER     NOT NULL DEFAULT 0,
  prices_extracted    INTEGER     NOT NULL DEFAULT 0,
  high_confidence_count INTEGER   NOT NULL DEFAULT 0,
  avg_price_published NUMERIC,                          -- final price pushed to market_prices (NULL if dry_run)
  is_dry_run          BOOLEAN     NOT NULL DEFAULT false,
  error_message       TEXT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at         TIMESTAMPTZ,
  triggered_by        UUID                              -- profile.id of admin who triggered
);

-- ── 3. fb_scraper_posts ──────────────────────────────────────────────────────
-- Raw post data saved per run (minimal — no personal data beyond page name)
CREATE TABLE IF NOT EXISTS public.fb_scraper_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID        NOT NULL REFERENCES public.fb_scraper_runs(id) ON DELETE CASCADE,
  source_id   UUID        REFERENCES public.fb_scraper_sources(id),
  post_id     TEXT,                    -- Apify postId
  page_name   TEXT,
  post_url    TEXT,
  post_text   TEXT        NOT NULL,
  post_date   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. fb_price_candidates ──────────────────────────────────────────────────
-- Individual extracted price candidates from a post text
CREATE TABLE IF NOT EXISTS public.fb_price_candidates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID        NOT NULL REFERENCES public.fb_scraper_runs(id) ON DELETE CASCADE,
  post_id          UUID        REFERENCES public.fb_scraper_posts(id) ON DELETE CASCADE,
  komoditas        TEXT        NOT NULL DEFAULT 'domba',
  region           TEXT        NOT NULL DEFAULT 'nasional',
  raw_text_snippet TEXT,                -- the matched text fragment
  price_idr        INTEGER     NOT NULL,
  price_type       TEXT        NOT NULL DEFAULT 'unknown',  -- farm_gate | buyer | unknown
  confidence_score NUMERIC     NOT NULL DEFAULT 0.0,        -- 0.0 – 1.0
  is_accepted      BOOLEAN     NOT NULL DEFAULT false,      -- true = used in market_prices calc
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fb_scraper_runs_status
  ON public.fb_scraper_runs(status);

CREATE INDEX IF NOT EXISTS idx_fb_scraper_runs_started_at
  ON public.fb_scraper_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_fb_scraper_posts_run_id
  ON public.fb_scraper_posts(run_id);

CREATE INDEX IF NOT EXISTS idx_fb_price_candidates_run_id
  ON public.fb_price_candidates(run_id);

CREATE INDEX IF NOT EXISTS idx_fb_price_candidates_accepted
  ON public.fb_price_candidates(is_accepted, komoditas);

-- ── RLS: Admin-only (superadmin bypasses automatically) ──────────────────────
ALTER TABLE public.fb_scraper_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_scraper_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_scraper_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_price_candidates   ENABLE ROW LEVEL SECURITY;

-- Superadmin write access (app_role = 'superadmin' OR role = 'superadmin')
CREATE POLICY "superadmin_all_fb_sources"
  ON public.fb_scraper_sources FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')));

CREATE POLICY "superadmin_all_fb_runs"
  ON public.fb_scraper_runs FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')));

CREATE POLICY "superadmin_all_fb_posts"
  ON public.fb_scraper_posts FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')));

CREATE POLICY "superadmin_all_fb_candidates"
  ON public.fb_price_candidates FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND (app_role = 'superadmin' OR role = 'superadmin')));

-- ── Seed: default domba sources (can be edited in admin UI) ──────────────────
INSERT INTO public.fb_scraper_sources (page_url, page_name, komoditas, region, notes) VALUES
  ('https://www.facebook.com/groups/jualbelidomba', 'Grup Jual Beli Domba', 'domba', 'nasional', 'Grup FB domba nasional'),
  ('https://www.facebook.com/groups/ternakdombajawabarat', 'Ternak Domba Jawa Barat', 'domba', 'Jawa Barat', 'Grup regional Jabar')
ON CONFLICT DO NOTHING;
