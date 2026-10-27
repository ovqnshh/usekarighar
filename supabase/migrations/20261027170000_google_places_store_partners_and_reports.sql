-- ==============================================================================
-- Migration: 20261027170000_google_places_store_partners_and_reports.sql
-- Description: Schema for Google Places Hardware Locator integration
--              - store_partners: verified onboarded trade partners with negotiated discounts
--              - store_reports: crowd-sourced report queue for inaccurate Google listings
--              - places_api_usage: audit counter to prevent quota runaway
-- ==============================================================================

-- 1. Store Partners (Only stores with a row here get the 'Karighar Partner' badge)
CREATE TABLE IF NOT EXISTS public.store_partners (
  google_place_id TEXT PRIMARY KEY,
  store_name TEXT,
  is_partner BOOLEAN NOT NULL DEFAULT true,
  partner_discount_pct NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (partner_discount_pct >= 0 AND partner_discount_pct <= 100),
  agreed_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for partner lookups
CREATE INDEX IF NOT EXISTS idx_store_partners_active ON public.store_partners (google_place_id) WHERE is_partner = true;

-- 2. Store Reports (Users/Artisans report wrong phone numbers, closures, wrong categories)
CREATE TABLE IF NOT EXISTS public.store_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT NOT NULL,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL CHECK (reason IN ('wrong_number', 'permanently_closed', 'not_a_hardware_store', 'overcharging', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_store_reports_place_id ON public.store_reports (google_place_id);
CREATE INDEX IF NOT EXISTS idx_store_reports_status ON public.store_reports (status);

-- 3. Places API Usage Counter (Tracks monthly consumption against budget limits)
CREATE TABLE IF NOT EXISTS public.places_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL, -- e.g. '2026-10'
  request_count INTEGER NOT NULL DEFAULT 1,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_places_usage_month UNIQUE (month_year)
);

-- Enable Row Level Security
ALTER TABLE public.store_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active partner discounts to apply them at checkout
CREATE POLICY "Public read active store partners"
  ON public.store_partners FOR SELECT
  USING (is_partner = true);

-- Anyone authenticated or anonymous can submit a store report
CREATE POLICY "Public submit store reports"
  ON public.store_reports FOR INSERT
  WITH CHECK (true);

-- API usage counter can be read/updated by service role
CREATE POLICY "Service role manages places api usage"
  ON public.places_api_usage FOR ALL
  USING (true)
  WITH CHECK (true);
