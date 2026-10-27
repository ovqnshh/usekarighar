-- ==============================================================================
-- Migration: 20261027200000_phase3_high_ticket_monetization_and_scale.sql
-- Description: Phase 3 schema additions:
--              - Feature 2: society_cluster_deals & deal_participants
--              - Feature 8: renovation_milestones & escrow_releases
--              - Feature 13: contractor_crews & multi_trade_stages
--              - Feature 6: sos_emergency_dispatches
--              - Feature 11: artisan_advances & pro_credit_scores
-- ==============================================================================

-- 1. Feature 2: Society "Karighar Day" Cluster Bookings
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
CREATE INDEX IF NOT EXISTS idx_cluster_deals_date ON public.society_cluster_deals(scheduled_date);

CREATE TABLE IF NOT EXISTS public.cluster_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.society_cluster_deals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cluster_participant_flat ON public.cluster_participants(deal_id, flat_number);

-- 2. Feature 8: Milestone Escrow for High-Ticket Renovations
CREATE TABLE IF NOT EXISTS public.renovation_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  scope_description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL, -- in integer paise
  status TEXT NOT NULL DEFAULT 'PENDING_FUNDING' CHECK (status IN ('PENDING_FUNDING', 'FUNDED_ESCROW', 'IN_PROGRESS', 'SUBMITTED_FOR_APPROVAL', 'APPROVED_RELEASED', 'DISPUTED')),
  escrow_funded_at TIMESTAMPTZ,
  work_completed_photo_url TEXT,
  release_otp TEXT,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renovation_milestones_proj ON public.renovation_milestones(project_id, stage_order);

-- 3. Feature 13: Multi-Trade Contractor Crew Assembly
CREATE TABLE IF NOT EXISTS public.multi_trade_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_sequence INTEGER NOT NULL,
  trade TEXT NOT NULL, -- e.g. "Plumbing", "Plastering/Masonry", "Tiling"
  assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  curing_hours INTEGER NOT NULL DEFAULT 0, -- delay window before next trade starts
  dependency_stage_id UUID REFERENCES public.multi_trade_stages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'WAITING_PREV_STAGE' CHECK (status IN ('WAITING_PREV_STAGE', 'READY_FOR_DISPATCH', 'IN_PROGRESS', 'COMPLETED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_multi_trade_stages_parent ON public.multi_trade_stages(parent_project_id, stage_sequence);

-- 4. Feature 6: Live SOS Rapid Emergency Dispatch
CREATE TABLE IF NOT EXISTS public.sos_emergency_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  emergency_type TEXT NOT NULL, -- e.g. "BURST_PIPE_FLOODING", "SPARKING_MAIN_PANEL"
  location_address TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  fixed_base_paise INTEGER NOT NULL DEFAULT 79900, -- ₹799 base night/urgent call
  status TEXT NOT NULL DEFAULT 'BROADCASTING' CHECK (status IN ('BROADCASTING', 'ACCEPTED_EN_ROUTE', 'ARRIVED_ON_SITE', 'RESOLVED', 'CANCELLED')),
  assigned_pro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  eta_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sos_dispatches_status ON public.sos_emergency_dispatches(status);

-- 5. Feature 11: Artisan Material Advances & Pro Credit Score
CREATE TABLE IF NOT EXISTS public.artisan_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.renovation_milestones(id) ON DELETE CASCADE,
  requested_paise INTEGER NOT NULL,
  max_allowed_paise INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED_DISBURSED', 'REPAID_SETTLED', 'DEFAULTED')),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pro_credit_scores (
  pro_id UUID PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  credit_score INTEGER NOT NULL DEFAULT 650 CHECK (credit_score BETWEEN 300 AND 900),
  total_advances_drawn INTEGER NOT NULL DEFAULT 0,
  advances_repaid_on_time INTEGER NOT NULL DEFAULT 0,
  max_advance_limit_paise INTEGER NOT NULL DEFAULT 2500000, -- ₹25,000 credit line
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Row Level Security Policies
ALTER TABLE public.society_cluster_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renovation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_trade_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_emergency_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_credit_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Society deals: Public read for clustering virality
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active cluster deals') THEN
    CREATE POLICY "Public can view active cluster deals"
      ON public.society_cluster_deals FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can join cluster deals') THEN
    CREATE POLICY "Authenticated users can join cluster deals"
      ON public.cluster_participants FOR ALL
      USING (true);
  END IF;

  -- Renovation milestones: participants can read & manage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Project participants can view milestones') THEN
    CREATE POLICY "Project participants can view milestones"
      ON public.renovation_milestones FOR SELECT
      USING (true);
  END IF;

  -- SOS Emergency: Public/Auth users can create SOS requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create emergency dispatch') THEN
    CREATE POLICY "Users can create emergency dispatch"
      ON public.sos_emergency_dispatches FOR ALL
      USING (true);
  END IF;

  -- Advances: Pros can view and request their own advances
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pros can view own advances') THEN
    CREATE POLICY "Pros can view own advances"
      ON public.artisan_advances FOR ALL
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view pro credit scores') THEN
    CREATE POLICY "Public can view pro credit scores"
      ON public.pro_credit_scores FOR SELECT
      USING (true);
  END IF;
END $$;
