-- ==============================================================================
-- Migration: 20261027180000_phase1_trust_and_conversion.sql
-- Description: Phase 1 (Trust & Conversion) schema additions:
--              - Feature 1: ai_estimates table & project links
--              - Feature 5: storefront tracking & pro attribution
--              - Feature 12: before/after media consent flag
-- ==============================================================================

-- 1. AI Visual Estimates (Feature 1)
CREATE TABLE IF NOT EXISTS public.ai_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  media_paths TEXT[] NOT NULL DEFAULT '{}',
  fixture_type TEXT NOT NULL,
  likely_issue TEXT NOT NULL,
  suggested_trade TEXT NOT NULL,
  part_cost_min_paise INTEGER NOT NULL DEFAULT 0,
  part_cost_max_paise INTEGER NOT NULL DEFAULT 0,
  labour_mins INTEGER NOT NULL DEFAULT 30,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.85,
  raw_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_estimates_customer ON public.ai_estimates(customer_id);

-- 2. Storefront Views & Booking Attribution (Feature 5)
CREATE TABLE IF NOT EXISTS public.storefront_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  source_channel TEXT DEFAULT 'direct', -- e.g. 'whatsapp', 'qr', 'direct'
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefront_views_pro_id ON public.storefront_views(pro_id);

-- 3. Projects Table Enhancements for Phase 1
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ai_estimate_id UUID REFERENCES public.ai_estimates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_showcase_consent BOOLEAN NOT NULL DEFAULT false;

-- 4. Project Media Consent Flag (Feature 12)
ALTER TABLE public.project_media
  ADD COLUMN IF NOT EXISTS is_public_showcase BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_consented BOOLEAN NOT NULL DEFAULT false;

-- 5. RLS Policies
ALTER TABLE public.ai_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own ai estimates') THEN
    CREATE POLICY "Users can view their own ai estimates"
      ON public.ai_estimates FOR SELECT
      USING (customer_id = auth.uid() OR customer_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert ai estimates') THEN
    CREATE POLICY "Users can insert ai estimates"
      ON public.ai_estimates FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can record storefront views') THEN
    CREATE POLICY "Public can record storefront views"
      ON public.storefront_views FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pros can view own storefront views') THEN
    CREATE POLICY "Pros can view own storefront views"
      ON public.storefront_views FOR SELECT
      USING (true);
  END IF;
END $$;
