-- ==============================================================================
-- Migration: 20261027190000_phase2_operations_retention_and_accessibility.sql
-- Description: Phase 2 schema additions:
--              - Feature 4: home_passports & passport_records (Flat DigiLocker)
--              - Feature 3: voice_dispatch_memos
--              - Feature 14: society_gate_passes
--              - Feature 7: material_verifications (Anti-Piracy Check)
--              - Feature 15: warranty_disputes & ai_arbitrations
--              - Feature 10: ppe_verifications
-- ==============================================================================

-- 1. Feature 4: Digital Home Health Passport (Flat DigiLocker)
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

CREATE TABLE IF NOT EXISTS public.passport_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id UUID NOT NULL REFERENCES public.home_passports(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  trade TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  parts_replaced JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ name, brand, part_no, mrp_paise }]
  before_photo_url TEXT,
  after_photo_url TEXT,
  total_paid_paise INTEGER NOT NULL DEFAULT 0,
  warranty_days INTEGER NOT NULL DEFAULT 30,
  warranty_expires_at TIMESTAMPTZ,
  pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passport_records_passport ON public.passport_records(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_records_warranty ON public.passport_records(warranty_expires_at);

-- 2. Feature 3: Voice-First Hinglish AI Dispatch
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

-- 3. Feature 14: Society Gate Pre-Pass (MyGate / NoBrokerHood Integration)
CREATE TABLE IF NOT EXISTS public.society_gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  society_name TEXT NOT NULL,
  flat_wing TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  resident_phone TEXT NOT NULL,
  pass_code TEXT NOT NULL, -- 6-digit numeric pass code for guard
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  guard_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VERIFIED_ENTRY', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gate_passes_project ON public.society_gate_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_code ON public.society_gate_passes(pass_code);

-- 4. Feature 7: Material Anti-Piracy Scanner
CREATE TABLE IF NOT EXISTS public.material_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_or_qr TEXT NOT NULL,
  isi_standard TEXT, -- e.g. "IS 694 for cables"
  is_authentic BOOLEAN NOT NULL DEFAULT true,
  verification_source TEXT NOT NULL DEFAULT 'barcode_lookup',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Feature 15: Warranty AI Dispute Arbitrator
CREATE TABLE IF NOT EXISTS public.warranty_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  passport_record_id UUID REFERENCES public.passport_records(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  complaint_description TEXT NOT NULL,
  new_damage_photo_url TEXT NOT NULL,
  ai_match_score NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  ai_verdict TEXT NOT NULL CHECK (ai_verdict IN ('WARRANTY_APPROVED_REWORK', 'NEW_ISSUE_DISCOUNTED_VISIT', 'MANUAL_REVIEW_REQUIRED')),
  ai_reasoning TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (resolution_status IN ('OPEN', 'RESOLVED_REWORK', 'RESOLVED_PAID', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_warranty_disputes_project ON public.warranty_disputes(project_id);

-- 6. Feature 10: PPE and Tool Safety Verification
CREATE TABLE IF NOT EXISTS public.ppe_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  selfie_photo_url TEXT NOT NULL,
  gloves_detected BOOLEAN NOT NULL DEFAULT false,
  safety_shoes_detected BOOLEAN NOT NULL DEFAULT false,
  helmet_or_glasses_detected BOOLEAN NOT NULL DEFAULT false,
  tool_kit_detected BOOLEAN NOT NULL DEFAULT false,
  overall_passed BOOLEAN NOT NULL DEFAULT true,
  ai_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Row Level Security Policies
ALTER TABLE public.home_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_dispatch_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppe_verifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Passports
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own home passports') THEN
    CREATE POLICY "Users can view their own home passports"
      ON public.home_passports FOR SELECT
      USING (customer_id = auth.uid() OR customer_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own home passports') THEN
    CREATE POLICY "Users can manage their own home passports"
      ON public.home_passports FOR ALL
      USING (customer_id = auth.uid() OR customer_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view passport records for their home') THEN
    CREATE POLICY "Users can view passport records for their home"
      ON public.passport_records FOR SELECT
      USING (true);
  END IF;

  -- Gate Passes (Public read for guards with pass_code or id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active gate passes') THEN
    CREATE POLICY "Public can view active gate passes"
      ON public.society_gate_passes FOR SELECT
      USING (true);
  END IF;

  -- Voice Memos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create voice dispatch memos') THEN
    CREATE POLICY "Users can create voice dispatch memos"
      ON public.voice_dispatch_memos FOR ALL
      USING (customer_id = auth.uid() OR customer_id IS NULL);
  END IF;

  -- Material Verifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view and create material verifications') THEN
    CREATE POLICY "Public can view and create material verifications"
      ON public.material_verifications FOR ALL
      USING (true);
  END IF;

  -- Warranty Disputes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own disputes') THEN
    CREATE POLICY "Users can view their own disputes"
      ON public.warranty_disputes FOR SELECT
      USING (customer_id = auth.uid() OR pro_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));
  END IF;

  -- PPE Verifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pros can upload PPE verifications') THEN
    CREATE POLICY "Pros can upload PPE verifications"
      ON public.ppe_verifications FOR ALL
      USING (true);
  END IF;
END $$;
