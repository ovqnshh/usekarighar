-- ==============================================================================
-- KARIGHAR: MASTER CONSOLIDATED DATABASE SCHEMA (PHASES 0 TO 3)
-- 100% IDEMPOTENT & ERROR-FREE SCRIPT FOR SUPABASE SQL EDITOR
-- Paste this entire file into:
-- https://supabase.com/dashboard/project/jioavuqzrhwnrydrcypk/sql/new
-- Click "RUN" (or Ctrl + Enter).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS (Safe try-catch blocks)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 0.5 PROFILES & ROBUST AUTH TRIGGER (PREVENTS DATABASE ERROR SAVING NEW USER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT 'Mumbai',
  avatar_url text DEFAULT '',
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'professional', 'admin')),
  is_karighar boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text DEFAULT 'Mumbai';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_karighar boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN city SET DEFAULT 'Mumbai';
ALTER TABLE public.profiles ALTER COLUMN avatar_url SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN is_karighar SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, city, is_karighar, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Mumbai',
    false,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user exception: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ------------------------------------------------------------------------------
-- 1. PLATFORM CONFIGURATION & SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
CREATE POLICY "Public read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated manage platform settings" ON public.platform_settings;
CREATE POLICY "Authenticated manage platform settings"
  ON public.platform_settings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('commission_rates', '{"online_escrow_pct": 10.0, "cod_pct": 12.0, "max_commission_cap_paise": 500000}', 'Platform take rates and statutory cess'),
  ('escrow_policy', '{"auto_release_hours": 48, "dispute_window_hours": 24, "min_wallet_for_cod_paise": -250000}', 'Escrow release timers and negative wallet limits'),
  ('dispatch_config', '{"offer_timeout_seconds": 90, "max_search_radius_km": 10, "emergency_fee_paise": 79900}', 'Dispatch timeouts and SOS surge base fees')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- ------------------------------------------------------------------------------
-- 2. PROJECTS TABLE COLUMNS & ATTRIBUTION
-- ------------------------------------------------------------------------------
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'ONLINE_ESCROW',
  ADD COLUMN IF NOT EXISTS quoted_amount_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_memo_url TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dependency_stage INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cluster_id UUID,
  ADD COLUMN IF NOT EXISTS warranty_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_estimate_id UUID,
  ADD COLUMN IF NOT EXISTS source_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_showcase_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ------------------------------------------------------------------------------
-- 3. STATE MACHINE: AUDIT EVENTS, OTPS & MEDIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_events
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS from_status TEXT,
  ADD COLUMN IF NOT EXISTS to_status TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_project_events_project ON public.project_events(project_id, created_at);
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project events" ON public.project_events;
CREATE POLICY "Public read project events"
  ON public.project_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert project events" ON public.project_events;
CREATE POLICY "Public insert project events"
  ON public.project_events FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.project_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('START', 'END', 'MILESTONE_RELEASE')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_otps
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS code_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_otps_lookup ON public.project_otps(project_id, kind);
ALTER TABLE public.project_otps ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'BEFORE' CHECK (kind IN ('BEFORE', 'AFTER', 'MATERIAL', 'COMPLAINT', 'SITE')),
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  customer_consent_for_gallery BOOLEAN NOT NULL DEFAULT false,
  is_public_showcase BOOLEAN NOT NULL DEFAULT false,
  customer_consented BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_media
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'BEFORE',
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS customer_consent_for_gallery BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public_showcase BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_consented BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_project_media_proj ON public.project_media(project_id, kind);
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project participants view media" ON public.project_media;
CREATE POLICY "Project participants view media"
  ON public.project_media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Project participants insert media" ON public.project_media;
CREATE POLICY "Project participants insert media"
  ON public.project_media FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. DOUBLE-ENTRY LEDGER & WALLETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  milestone_id UUID,
  account TEXT CHECK (account IN ('CUSTOMER', 'ESCROW', 'PLATFORM_REVENUE', 'KARIGAR_WALLET', 'KARIGAR_ADVANCE', 'REFUNDS', 'PAYOUT_BANK')),
  direction TEXT CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_paise BIGINT DEFAULT 0,
  reason TEXT DEFAULT '',
  ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Ensure columns exist if table was already created in earlier migration
ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS milestone_id UUID,
  ADD COLUMN IF NOT EXISTS account TEXT CHECK (account IN ('CUSTOMER', 'ESCROW', 'PLATFORM_REVENUE', 'KARIGAR_WALLET', 'KARIGAR_ADVANCE', 'REFUNDS', 'PAYOUT_BANK')),
  ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('DEBIT', 'CREDIT')),
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ref TEXT;

CREATE INDEX IF NOT EXISTS idx_ledger_project ON public.ledger_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.ledger_entries(account, created_at);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view ledger" ON public.ledger_entries;
CREATE POLICY "Authenticated users view ledger"
  ON public.ledger_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert ledger entries" ON public.ledger_entries;
CREATE POLICY "Insert ledger entries"
  ON public.ledger_entries FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.karigar_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  cached_balance_paise BIGINT NOT NULL DEFAULT 0,
  advance_balance_paise BIGINT NOT NULL DEFAULT 0,
  credit_tier TEXT NOT NULL DEFAULT 'standard' CHECK (credit_tier IN ('new', 'standard', 'silver', 'gold', 'elite')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Ensure columns exist if table was already created in earlier migration
ALTER TABLE public.karigar_wallets
  ADD COLUMN IF NOT EXISTS cached_balance_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_balance_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_tier TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.karigar_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View karigar wallets" ON public.karigar_wallets;
CREATE POLICY "View karigar wallets"
  ON public.karigar_wallets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage karigar wallets" ON public.karigar_wallets;
CREATE POLICY "Manage karigar wallets"
  ON public.karigar_wallets FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID,
  provider TEXT NOT NULL DEFAULT 'ManualUpiProvider',
  provider_ref TEXT,
  amount_paise BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'AUTHORISED', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED')),
  method TEXT NOT NULL DEFAULT 'UPI',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS milestone_id UUID,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'ManualUpiProvider',
  ADD COLUMN IF NOT EXISTS provider_ref TEXT,
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CREATED',
  ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'UPI',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View payments" ON public.payments;
CREATE POLICY "View payments"
  ON public.payments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage payments" ON public.payments;
CREATE POLICY "Manage payments"
  ON public.payments FOR ALL
  USING (true);

-- ------------------------------------------------------------------------------
-- 5. MATERIAL CATALOG & SMART SPARE PART FINDER (Feature 18)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_catalog (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  spec TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  typical_use TEXT NOT NULL,
  mrp_paise INTEGER NOT NULL CHECK (mrp_paise >= 0),
  trade_price_min_paise INTEGER NOT NULL CHECK (trade_price_min_paise >= 0),
  trade_price_max_paise INTEGER NOT NULL CHECK (trade_price_max_paise >= trade_price_min_paise),
  city TEXT NOT NULL DEFAULT 'Mumbai',
  source TEXT NOT NULL DEFAULT 'admin_verified',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Add columns idempotently if table already existed
ALTER TABLE public.material_catalog
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS spec TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS typical_use TEXT,
  ADD COLUMN IF NOT EXISTS mrp_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trade_price_min_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trade_price_max_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin_verified',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Safe trigger for search_text computation (avoids 42P17 generation expression is not immutable)
CREATE OR REPLACE FUNCTION public.compute_material_catalog_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := coalesce(NEW.brand, '') || ' ' ||
                     coalesce(NEW.name, '') || ' ' ||
                     coalesce(NEW.spec, '') || ' ' ||
                     array_to_string(coalesce(NEW.aliases, '{}'), ' ') || ' ' ||
                     coalesce(NEW.description, '') || ' ' ||
                     coalesce(NEW.typical_use, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_catalog_search_text ON public.material_catalog;
CREATE TRIGGER trg_material_catalog_search_text
  BEFORE INSERT OR UPDATE ON public.material_catalog
  FOR EACH ROW EXECUTE FUNCTION public.compute_material_catalog_search_text();

-- Safely add vector embedding column if pgvector is available
DO $$ BEGIN
  ALTER TABLE public.material_catalog ADD COLUMN IF NOT EXISTS embedding vector(768);
EXCEPTION WHEN OTHERS THEN
  ALTER TABLE public.material_catalog ADD COLUMN IF NOT EXISTS embedding jsonb;
END $$;

CREATE INDEX IF NOT EXISTS idx_material_catalog_category ON public.material_catalog(category, subcategory);
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read material catalog" ON public.material_catalog;
CREATE POLICY "Public read material catalog"
  ON public.material_catalog FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.part_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  language TEXT,
  matched_ids TEXT[],
  chosen_id TEXT,
  confidence NUMERIC(3, 2),
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.part_search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert part search logs" ON public.part_search_logs;
CREATE POLICY "Public insert part search logs"
  ON public.part_search_logs FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. HARDWARE STORE LOCATOR (Feature 17)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_store_partners_active ON public.store_partners (google_place_id) WHERE is_partner = true;
ALTER TABLE public.store_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active store partners" ON public.store_partners;
CREATE POLICY "Public read active store partners"
  ON public.store_partners FOR SELECT
  USING (is_partner = true);

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
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public submit store reports" ON public.store_reports;
CREATE POLICY "Public submit store reports"
  ON public.store_reports FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.places_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE,
  request_count INTEGER NOT NULL DEFAULT 1,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.places_api_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage places api usage" ON public.places_api_usage;
CREATE POLICY "Public manage places api usage"
  ON public.places_api_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. PHASE 1: TRUST & CONVERSION (Features 1 & 5)
-- ------------------------------------------------------------------------------
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
ALTER TABLE public.ai_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View ai estimates" ON public.ai_estimates;
CREATE POLICY "View ai estimates"
  ON public.ai_estimates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert ai estimates" ON public.ai_estimates;
CREATE POLICY "Insert ai estimates"
  ON public.ai_estimates FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.storefront_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  source_channel TEXT DEFAULT 'direct',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefront_views_pro_id ON public.storefront_views(pro_id);
ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert storefront views" ON public.storefront_views;
CREATE POLICY "Public insert storefront views"
  ON public.storefront_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read storefront views" ON public.storefront_views;
CREATE POLICY "Public read storefront views"
  ON public.storefront_views FOR SELECT
  USING (true);

-- ------------------------------------------------------------------------------
-- 8. PHASE 2: OPERATIONS & RETENTION (Features 4, 3, 14, 7, 15, 10)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.home_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  building_society TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  pincode TEXT NOT NULL,
  qr_code_hash TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_passports_customer ON public.home_passports(customer_id);
CREATE INDEX IF NOT EXISTS idx_home_passports_society ON public.home_passports(building_society, flat_number);
ALTER TABLE public.home_passports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage home passports" ON public.home_passports;
CREATE POLICY "Manage home passports"
  ON public.home_passports FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.passport_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id UUID REFERENCES public.home_passports(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  trade TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  parts_replaced JSONB NOT NULL DEFAULT '[]'::jsonb,
  before_photo_url TEXT,
  after_photo_url TEXT,
  total_paid_paise INTEGER NOT NULL DEFAULT 0,
  warranty_days INTEGER NOT NULL DEFAULT 30,
  warranty_expires_at TIMESTAMPTZ,
  pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.passport_records
  ADD COLUMN IF NOT EXISTS passport_id UUID REFERENCES public.home_passports(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trade TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS parts_replaced JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS total_paid_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warranty_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS warranty_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_passport_records_passport ON public.passport_records(passport_id);
ALTER TABLE public.passport_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage passport records" ON public.passport_records;
CREATE POLICY "Manage passport records"
  ON public.passport_records FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.voice_dispatch_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audio_url TEXT,
  transcript_raw TEXT NOT NULL,
  detected_language TEXT NOT NULL DEFAULT 'hinglish',
  parsed_trades TEXT[] NOT NULL DEFAULT '{}',
  urgency TEXT NOT NULL DEFAULT 'standard' CHECK (urgency IN ('emergency', 'same_day', 'standard')),
  extracted_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_dispatch_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage voice memos" ON public.voice_dispatch_memos;
CREATE POLICY "Manage voice memos"
  ON public.voice_dispatch_memos FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.society_gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  society_name TEXT NOT NULL,
  flat_wing TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  resident_phone TEXT NOT NULL,
  pass_code TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  guard_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VERIFIED_ENTRY', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.society_gate_passes
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS society_name TEXT,
  ADD COLUMN IF NOT EXISTS flat_wing TEXT,
  ADD COLUMN IF NOT EXISTS resident_name TEXT,
  ADD COLUMN IF NOT EXISTS resident_phone TEXT,
  ADD COLUMN IF NOT EXISTS pass_code TEXT,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guard_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_gate_passes_project ON public.society_gate_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_code ON public.society_gate_passes(pass_code);
ALTER TABLE public.society_gate_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View active gate passes" ON public.society_gate_passes;
CREATE POLICY "View active gate passes"
  ON public.society_gate_passes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage gate passes" ON public.society_gate_passes;
CREATE POLICY "Manage gate passes"
  ON public.society_gate_passes FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.material_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_or_qr TEXT NOT NULL,
  isi_standard TEXT,
  is_authentic BOOLEAN NOT NULL DEFAULT true,
  verification_source TEXT NOT NULL DEFAULT 'barcode_lookup',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.material_verifications
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS serial_or_qr TEXT,
  ADD COLUMN IF NOT EXISTS isi_standard TEXT,
  ADD COLUMN IF NOT EXISTS is_authentic BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'barcode_lookup',
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.material_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage material verifications" ON public.material_verifications;
CREATE POLICY "Manage material verifications"
  ON public.material_verifications FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.warranty_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  passport_record_id UUID REFERENCES public.passport_records(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  complaint_description TEXT NOT NULL,
  new_damage_photo_url TEXT,
  ai_match_score NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  ai_verdict TEXT NOT NULL CHECK (ai_verdict IN ('WARRANTY_APPROVED_REWORK', 'NEW_ISSUE_DISCOUNTED_VISIT', 'MANUAL_REVIEW_REQUIRED')),
  ai_reasoning TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (resolution_status IN ('OPEN', 'RESOLVED_REWORK', 'RESOLVED_PAID', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.warranty_disputes
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS passport_record_id UUID REFERENCES public.passport_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS complaint_description TEXT,
  ADD COLUMN IF NOT EXISTS new_damage_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_match_score NUMERIC(3, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS ai_verdict TEXT DEFAULT 'MANUAL_REVIEW_REQUIRED',
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'OPEN';

CREATE INDEX IF NOT EXISTS idx_warranty_disputes_project ON public.warranty_disputes(project_id);
ALTER TABLE public.warranty_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage warranty disputes" ON public.warranty_disputes;
CREATE POLICY "Manage warranty disputes"
  ON public.warranty_disputes FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.ppe_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  selfie_photo_url TEXT,
  gloves_detected BOOLEAN NOT NULL DEFAULT false,
  safety_shoes_detected BOOLEAN NOT NULL DEFAULT false,
  helmet_or_glasses_detected BOOLEAN NOT NULL DEFAULT false,
  tool_kit_detected BOOLEAN NOT NULL DEFAULT false,
  overall_passed BOOLEAN NOT NULL DEFAULT true,
  ai_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ppe_verifications
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS selfie_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS gloves_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS safety_shoes_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS helmet_or_glasses_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tool_kit_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS overall_passed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3, 2) DEFAULT 0.90;

ALTER TABLE public.ppe_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage ppe verifications" ON public.ppe_verifications;
CREATE POLICY "Manage ppe verifications"
  ON public.ppe_verifications FOR ALL
  USING (true);

-- ------------------------------------------------------------------------------
-- 9. PHASE 3: HIGH-TICKET & SCALE (Features 2, 8, 13, 6, 11)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.society_cluster_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_name TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  trade TEXT NOT NULL,
  title TEXT NOT NULL,
  target_flats INTEGER NOT NULL DEFAULT 4,
  current_flats INTEGER NOT NULL DEFAULT 1,
  discount_pct INTEGER NOT NULL DEFAULT 15,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'GATHERING' CHECK (status IN ('GATHERING', 'CONFIRMED', 'DISPATCHED', 'COMPLETED', 'EXPIRED')),
  assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cluster_deals_society ON public.society_cluster_deals(society_name, status);
ALTER TABLE public.society_cluster_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view cluster deals" ON public.society_cluster_deals;
CREATE POLICY "Public view cluster deals"
  ON public.society_cluster_deals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage cluster deals" ON public.society_cluster_deals;
CREATE POLICY "Manage cluster deals"
  ON public.society_cluster_deals FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.cluster_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.society_cluster_deals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cluster_participants
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.society_cluster_deals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS flat_number TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cluster_participant_flat ON public.cluster_participants(deal_id, flat_number);
ALTER TABLE public.cluster_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage cluster participants" ON public.cluster_participants;
CREATE POLICY "Manage cluster participants"
  ON public.cluster_participants FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.renovation_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  scope_description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_FUNDING' CHECK (status IN ('PENDING_FUNDING', 'FUNDED_ESCROW', 'IN_PROGRESS', 'SUBMITTED_FOR_APPROVAL', 'APPROVED_RELEASED', 'DISPUTED')),
  escrow_funded_at TIMESTAMPTZ,
  work_completed_photo_url TEXT,
  release_otp TEXT,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.renovation_milestones
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS stage_order INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS scope_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING_FUNDING',
  ADD COLUMN IF NOT EXISTS escrow_funded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS work_completed_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS release_otp TEXT,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_renovation_milestones_proj ON public.renovation_milestones(project_id, stage_order);
ALTER TABLE public.renovation_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage renovation milestones" ON public.renovation_milestones;
CREATE POLICY "Manage renovation milestones"
  ON public.renovation_milestones FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.multi_trade_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_sequence INTEGER NOT NULL,
  trade TEXT NOT NULL,
  assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  curing_hours INTEGER NOT NULL DEFAULT 0,
  dependency_stage_id UUID REFERENCES public.multi_trade_stages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'WAITING_PREV_STAGE' CHECK (status IN ('WAITING_PREV_STAGE', 'READY_FOR_DISPATCH', 'IN_PROGRESS', 'COMPLETED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multi_trade_stages
  ADD COLUMN IF NOT EXISTS parent_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS stage_sequence INTEGER,
  ADD COLUMN IF NOT EXISTS trade TEXT,
  ADD COLUMN IF NOT EXISTS assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS curing_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dependency_stage_id UUID REFERENCES public.multi_trade_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'WAITING_PREV_STAGE',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_multi_trade_stages_parent ON public.multi_trade_stages(parent_project_id, stage_sequence);
ALTER TABLE public.multi_trade_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage multi trade stages" ON public.multi_trade_stages;
CREATE POLICY "Manage multi trade stages"
  ON public.multi_trade_stages FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.sos_emergency_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  emergency_type TEXT NOT NULL,
  location_address TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  fixed_base_paise INTEGER NOT NULL DEFAULT 79900,
  status TEXT NOT NULL DEFAULT 'BROADCASTING' CHECK (status IN ('BROADCASTING', 'ACCEPTED_EN_ROUTE', 'ARRIVED_ON_SITE', 'RESOLVED', 'CANCELLED')),
  assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  eta_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sos_emergency_dispatches
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trade TEXT,
  ADD COLUMN IF NOT EXISTS emergency_type TEXT,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS fixed_base_paise INTEGER DEFAULT 79900,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'BROADCASTING',
  ADD COLUMN IF NOT EXISTS assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eta_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_sos_dispatches_status ON public.sos_emergency_dispatches(status);
ALTER TABLE public.sos_emergency_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage sos dispatches" ON public.sos_emergency_dispatches;
CREATE POLICY "Manage sos dispatches"
  ON public.sos_emergency_dispatches FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.artisan_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.renovation_milestones(id) ON DELETE CASCADE,
  requested_paise INTEGER NOT NULL,
  max_allowed_paise INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED_DISBURSED', 'REPAID_SETTLED', 'DEFAULTED')),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artisan_advances
  ADD COLUMN IF NOT EXISTS pro_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.renovation_milestones(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requested_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_allowed_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMPTZ;

ALTER TABLE public.artisan_advances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage artisan advances" ON public.artisan_advances;
CREATE POLICY "Manage artisan advances"
  ON public.artisan_advances FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.pro_credit_scores (
  pro_id UUID PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  credit_score INTEGER NOT NULL DEFAULT 650 CHECK (credit_score BETWEEN 300 AND 900),
  total_advances_drawn INTEGER NOT NULL DEFAULT 0,
  advances_repaid_on_time INTEGER NOT NULL DEFAULT 0,
  max_advance_limit_paise INTEGER NOT NULL DEFAULT 2500000,
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_credit_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View pro credit scores" ON public.pro_credit_scores;
CREATE POLICY "View pro credit scores"
  ON public.pro_credit_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage pro credit scores" ON public.pro_credit_scores;
CREATE POLICY "Manage pro credit scores"
  ON public.pro_credit_scores FOR ALL
  USING (true);

-- ------------------------------------------------------------------------------
-- 11. ARTISAN REFERRAL REWARDS & MILESTONE CHALLENGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artisan_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer_name TEXT NOT NULL,
  referrer_contact TEXT NOT NULL,
  referred_name TEXT NOT NULL,
  referred_contact TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('EMAIL', 'PHONE')),
  trade TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Mumbai',
  referral_code TEXT NOT NULL UNIQUE,
  personal_note TEXT,
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'REGISTERED', 'KYC_VERIFIED', 'FIRST_JOB_COMPLETED', 'REWARD_DISBURSED')),
  reward_paise INTEGER NOT NULL DEFAULT 50000,
  pro_bonus_paise INTEGER NOT NULL DEFAULT 25000,
  registered_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  first_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  reward_disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artisan_referrals
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrer_name TEXT,
  ADD COLUMN IF NOT EXISTS referrer_contact TEXT,
  ADD COLUMN IF NOT EXISTS referred_name TEXT,
  ADD COLUMN IF NOT EXISTS referred_contact TEXT,
  ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'PHONE',
  ADD COLUMN IF NOT EXISTS trade TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai',
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS personal_note TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'INVITED',
  ADD COLUMN IF NOT EXISTS reward_paise INTEGER DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS pro_bonus_paise INTEGER DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS registered_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reward_disbursed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_artisan_referrals_referrer ON public.artisan_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_referrals_code ON public.artisan_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_artisan_referrals_status ON public.artisan_referrals(status);

ALTER TABLE public.artisan_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert artisan referrals" ON public.artisan_referrals;
CREATE POLICY "Public insert artisan referrals"
  ON public.artisan_referrals FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public view artisan referrals" ON public.artisan_referrals;
CREATE POLICY "Public view artisan referrals"
  ON public.artisan_referrals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Update artisan referrals" ON public.artisan_referrals;
CREATE POLICY "Update artisan referrals"
  ON public.artisan_referrals FOR UPDATE
  USING (true)
  WITH CHECK (true);

