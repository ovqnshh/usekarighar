-- ============================================================================
-- KARIGHAR PRODUCTION COMPLETE UNIFIED DATABASE MIGRATION SCRIPT
-- Contains ALL tables, enums, triggers, RLS policies, double-entry ledger,
-- compliance profiles, and seed data for all trades (including AC & Appliances).
-- Idempotent: safe to run on both clean and existing Supabase PostgreSQL databases.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. BASELINE ENTITIES: PROFILES & PROFESSIONALS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT 'Mumbai',
  avatar_url text DEFAULT '',
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'professional', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Professionals Storefront Table
CREATE TABLE IF NOT EXISTS public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  business text NOT NULL,
  trade text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Mumbai',
  bio text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  rating numeric NOT NULL DEFAULT 4.9,
  reviews int NOT NULL DEFAULT 0,
  projects_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users create own storefront" ON public.professionals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own storefront" ON public.professionals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION public.owns_professional(_pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.professionals WHERE id = _pid AND user_id = auth.uid())
$$;

-- ----------------------------------------------------------------------------
-- 2. GIGS & SERVICES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  starting_price int NOT NULL DEFAULT 0,
  included text[] NOT NULL DEFAULT '{}',
  not_included text[] NOT NULL DEFAULT '{}',
  duration text NOT NULL DEFAULT '',
  materials text NOT NULL DEFAULT 'professional' CHECK (materials IN ('customer','professional','help')),
  service_area text NOT NULL DEFAULT '',
  availability text NOT NULL DEFAULT '',
  addons jsonb NOT NULL DEFAULT '[]',
  warranty text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view gigs" ON public.gigs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner inserts gigs" ON public.gigs FOR INSERT TO authenticated WITH CHECK (public.owns_professional(professional_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner updates gigs" ON public.gigs FOR UPDATE TO authenticated USING (public.owns_professional(professional_id)) WITH CHECK (public.owns_professional(professional_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner deletes gigs" ON public.gigs FOR DELETE TO authenticated USING (public.owns_professional(professional_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. PROJECTS & DIRECT BOOKINGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  intent text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  timing text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  source text NOT NULL DEFAULT 'quote' CHECK (source IN ('quote','gig')),
  professional_id uuid REFERENCES public.professionals(id),
  gig_id uuid REFERENCES public.gigs(id) ON DELETE SET NULL,
  price int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('requested','requesting_quotes','scheduled','in_progress','complete','completed','cancelled','draft'));

CREATE OR REPLACE FUNCTION public.owns_project(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _id AND customer_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.pro_on_project(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.quotes q JOIN public.professionals p ON p.id = q.professional_id WHERE q.project_id = _id AND p.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects pr JOIN public.professionals p ON p.id = pr.professional_id WHERE pr.id = _id AND p.user_id = auth.uid())
$$;

DO $$ BEGIN
  CREATE POLICY "Customer manages own projects" ON public.projects FOR ALL TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Professionals see related projects" ON public.projects FOR SELECT TO authenticated USING (public.pro_on_project(id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 4. QUOTES & ITEMIZATION
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','submitted','accepted','declined')),
  labour int NOT NULL DEFAULT 0,
  materials_cost int NOT NULL DEFAULT 0,
  transport int NOT NULL DEFAULT 0,
  other int NOT NULL DEFAULT 0,
  platform_fee int NOT NULL DEFAULT 0,
  tax int NOT NULL DEFAULT 0,
  total int GENERATED ALWAYS AS (labour + materials_cost + transport + other + platform_fee + tax) STORED,
  duration text NOT NULL DEFAULT '',
  workers int NOT NULL DEFAULT 1,
  materials text NOT NULL DEFAULT 'professional' CHECK (materials IN ('customer','professional','help')),
  warranty text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE (project_id, professional_id)
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Customer views quotes on own projects" ON public.quotes FOR SELECT TO authenticated USING (public.owns_project(project_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Professional views own quotes" ON public.quotes FOR SELECT TO authenticated USING (public.owns_professional(professional_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Customer requests quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.owns_project(project_id) AND status = 'requested');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 5. MESSAGING & IN-APP CHAT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Project participants view messages" ON public.messages FOR SELECT TO authenticated
  USING (public.owns_project(project_id) OR public.pro_on_project(project_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Project participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND (public.owns_project(project_id) OR public.pro_on_project(project_id)));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 6. REVIEWS, SHORTLIST & VERIFICATIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id),
  project_id uuid REFERENCES public.projects(id),
  rating numeric NOT NULL DEFAULT 5,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users submit reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.saved_karighars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id)
);
ALTER TABLE public.saved_karighars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own shortlist" ON public.saved_karighars FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.karighar_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'verified',
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.karighar_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karighar_verifications DROP CONSTRAINT IF EXISTS karighar_verifications_type_check;
ALTER TABLE public.karighar_verifications DROP CONSTRAINT IF EXISTS karighar_verifications_status_check;

DO $$ BEGIN
  CREATE POLICY "Anyone can view verifications" ON public.karighar_verifications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.karighar_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.karighar_availability ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view availability" ON public.karighar_availability FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Technician',
  phone text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages agency members" ON public.agency_members FOR ALL TO authenticated
  USING (public.owns_professional(professional_id)) WITH CHECK (public.owns_professional(professional_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 7. CONFIGURABLE BUSINESS POLICIES & LOCATION ZONES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.config_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('finance', 'pricing', 'operations', 'dispatch', 'compliance', 'general')),
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.config_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read active config policies" ON public.config_policies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO public.config_policies (key, category, value, description) VALUES
('COMMISSION_RATES', 'finance', '{"default_rate": 0.15, "tier_discounts": {"new": 0.18, "verified": 0.15, "elite": 0.12}}'::jsonb, 'Standard commission rates and tiered KYC discounts'),
('INSPECTION_FEES', 'pricing', '{"electrical": 199, "plumbing": 149, "carpentry": 199, "ac_appliance": 249, "general": 149}'::jsonb, 'Diagnostic visit inspection fees credited towards completed jobs'),
('CANCELLATION_POLICY', 'operations', '{"free_window_minutes": 60, "late_cancel_customer_fee": 100, "late_cancel_karigar_penalty": 150}'::jsonb, 'Rules for doorstep service cancellations and dispatch penalties'),
('DISPATCH_CONFIG', 'dispatch', '{"offer_timeout_seconds": 45, "max_cascade_depth": 5, "search_radius_km": 12}'::jsonb, 'Parameters governing the broadcast and cascade dispatch engine'),
('CASH_WALLET_LIMITS', 'finance', '{"max_deficit_inr": 2500, "warning_threshold_inr": 2000}'::jsonb, 'Pro threshold for collecting cash payments before ledger reconciliation lock'),
('ESCROW_CONFIG', 'finance', '{"auto_release_hours": 48, "dispute_resolution_sla_hours": 24}'::jsonb, 'SafePay escrow dispute hold and auto-payout timers'),
('GIG_WORKER_STATUTORY_CONTRIBUTION', 'compliance', '{"code_on_social_security_pct": 0.015, "state_welfare_cess_pct": 0.01}'::jsonb, 'Statutory contributions under the Indian Code on Social Security')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.service_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_cities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read cities" ON public.service_cities FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO public.service_cities (name, state, is_active) VALUES
('Mumbai', 'Maharashtra', true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.service_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES public.service_cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pincodes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read zones" ON public.service_zones FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 8. 4-TIER DYNAMIC CATALOG ENGINE & PRICE BOOK
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT NOT NULL DEFAULT 'Wrench',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read catalog categories" ON public.catalog_categories FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO public.catalog_categories (slug, name, description, icon_name, display_order) VALUES
('ac-appliances', 'AC & Appliances', 'Cooling, compressors, refrigeration, and home appliances', 'Fan', 1),
('plumbing', 'Plumbing & Water Systems', 'Leak repairs, bathroom fittings, tanks, and valves', 'Droplet', 2),
('electrical', 'Electrical & Wiring', 'MCB safety, switchboards, lighting, and load balancing', 'Plug', 3),
('carpentry', 'Carpentry & Woodwork', 'Custom furniture, wardrobes, hinges, and kitchen fittings', 'Hammer', 4),
('painting', 'Painting & Wall Finishes', 'Waterproof textures, interior emulsion, and putty prep', 'PaintRoller', 5),
('waterproofing', 'Waterproofing', 'Seepage barriers, polymer joint grouting, and terrace coats', 'Umbrella', 6),
('tiling', 'Tiling & Flooring', 'Italian marble, vitrified tiles, and laser levelling', 'LayoutGrid', 7),
('pest-control', 'Pest Control', 'Eco-friendly odorless treatments and herbal baiting', 'Bug', 8)
ON CONFLICT (slug) DO NOTHING;

DO $$ BEGIN
    CREATE TYPE public.pricing_mode_enum AS ENUM ('fixed_menu', 'visit_quote', 'milestone_escrow', 'hourly_rate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.catalog_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT NOT NULL DEFAULT 'Wrench',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_subcategories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read catalog subcategories" ON public.catalog_subcategories FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.catalog_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.catalog_subcategories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    pricing_mode public.pricing_mode_enum NOT NULL DEFAULT 'visit_quote',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    visit_fee NUMERIC(10, 2) NOT NULL DEFAULT 199,
    estimated_duration_mins INT NOT NULL DEFAULT 60,
    warranty_days INT NOT NULL DEFAULT 30,
    required_kyc_tier TEXT NOT NULL DEFAULT 'verified',
    safety_risk_level TEXT NOT NULL DEFAULT 'standard' CHECK (safety_risk_level IN ('standard', 'high_voltage', 'height', 'hazardous')),
    whats_included TEXT[] DEFAULT '{}',
    whats_excluded TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read catalog services" ON public.catalog_services FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.price_book_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.catalog_subcategories(id) ON DELETE SET NULL,
    item_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'piece',
    customer_price_cap NUMERIC(10, 2) NOT NULL,
    standard_cost NUMERIC(10, 2) NOT NULL,
    brand_recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.price_book_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read price book" ON public.price_book_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 9. KYC COMPLIANCE, DISPATCH & ON-SITE EVIDENCE
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.kyc_tier_enum AS ENUM ('new', 'verified', 'elite');
    CREATE TYPE public.verification_type_enum AS ENUM (
        'phone_otp', 'digilocker_aadhaar', 'pan', 'police_clearance', 'skill_assessment', 'practical_demo'
    );
    CREATE TYPE public.verification_status_enum AS ENUM ('pending', 'submitted', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.karigar_compliance_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
    kyc_tier public.kyc_tier_enum NOT NULL DEFAULT 'new',
    pan_number TEXT,
    digilocker_verified_name TEXT,
    police_verification_number TEXT,
    police_verified_at TIMESTAMPTZ,
    e_shram_uan TEXT,
    engagement_days_fy INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.karigar_compliance_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE TYPE public.dispatch_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.dispatch_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    status public.dispatch_status_enum NOT NULL DEFAULT 'pending',
    offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    earnings_estimate NUMERIC(10, 2) NOT NULL,
    distance_km NUMERIC(5, 2) NOT NULL DEFAULT 2.5
);
ALTER TABLE public.dispatch_offers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_on_site_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    media_url TEXT,
    notes TEXT,
    verified_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_on_site_evidence ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 10. DOUBLE-ENTRY FINANCIAL LEDGER & WALLETS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read ledger accounts" ON public.ledger_accounts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO public.ledger_accounts (code, name, type) VALUES
('1010-CUST-ESCROW', 'Customer Escrow Funds Held', 'liability'),
('2010-PLATFORM-REV', 'Platform Commission Revenue', 'revenue'),
('2020-GST-PAYABLE', 'GST Output Tax Payable', 'liability'),
('3010-PRO-PAYABLE', 'Karigar Service Earnings Payable', 'liability'),
('1020-CASH-RECEIVABLE', 'Karigar Cash Commission Receivable', 'asset')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    debit_account_id UUID REFERENCES public.ledger_accounts(id),
    credit_account_id UUID REFERENCES public.ledger_accounts(id),
    amount_inr NUMERIC(10, 2) NOT NULL,
    narration TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.karigar_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
    current_balance_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_deficit_limit_inr NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
    is_blocked_for_cash BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.karigar_wallets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 11. TRUST, SAFETY & EMERGENCY SOS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.sos_severity_enum AS ENUM ('medium', 'high', 'critical');
    CREATE TYPE public.sos_status_enum AS ENUM ('triggered', 'in_triage', 'police_alerted', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.sos_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES auth.users(id),
    severity public.sos_severity_enum NOT NULL DEFAULT 'critical',
    status public.sos_status_enum NOT NULL DEFAULT 'triggered',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    incident_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read their own SOS" ON public.sos_incidents FOR ALL USING (auth.uid() = triggered_by);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 12. SEED DATA: COMPLETE VERIFIED KARIGHARS & STARTER GIGS
-- ----------------------------------------------------------------------------

INSERT INTO public.professionals (slug, name, business, trade, city, experience, rating, reviews, projects_count, bio) VALUES
('vikram-sharma', 'Vikram Sharma', 'CoolCare Climate Engineering', 'AC & appliance repair/installation', 'Powai, Mumbai', '9 years', 4.95, 184, 310, 'Certified inverter AC and HVAC technician. Specializes in R32 leak tests, deep coil jet wash, and compressor restoration.'),
('imran-qureshi', 'Imran Qureshi', 'Qureshi HVAC & Appliance Labs', 'AC & appliance repair/installation', 'Bandra West, Mumbai', '11 years', 4.88, 112, 195, 'Expert troubleshooting for split and multi-split AC units, refrigerators, and circuit boards with genuine spares.'),
('arjun-nair', 'Arjun Nair', 'Nair Plumbing Works', 'Plumbing repair & installation', 'Andheri West, Mumbai', '12 years', 4.92, 128, 214, 'Concealed plumbing diagnosis, pressure valve restoration, and bathroom drainage overhaul for Mumbai residences.'),
('rohan-patil', 'Rohan Patil', 'Circuit House Electricals', 'Electrical repair & installation', 'Powai, Mumbai', '8 years', 4.81, 67, 143, 'Safe, certified electrical diagnostics, MCB load balancing, and switchboard restoration with thermal checks.'),
('meera-shah', 'Meera Shah', 'Studio Mitti Woodworks', 'Carpentry & custom furniture', 'Bandra, Mumbai', '10 years', 4.88, 94, 76, 'Custom marine-ply wardrobes, precision hydraulic hinges, and bespoke storage solutions with lifetime finishes.'),
('sunil-verma', 'Sunil Verma', 'Verma Art & Wall Finishes', 'Painting & wall finishing', 'Juhu, Mumbai', '14 years', 4.90, 78, 110, 'Dustless machine sanding, anti-fungal primer coat, and luxury washable emulsion finishes.'),
('dinesh-kulkarni', 'Dinesh Kulkarni', 'Kulkarni Seepage & Water Solutions', 'Waterproofing', 'Thane West, Mumbai', '15 years', 4.94, 104, 162, 'Polymer joint grouting, bathroom tile barrier injection, and 10-year warranted terrace moisture seals.'),
('ramesh-yadav', 'Ramesh Yadav', 'Yadav Tile & Stone Finishing', 'Tiling & flooring', 'Goregaon East, Mumbai', '13 years', 4.86, 58, 89, 'Laser-levelled vitrified tile laying, epoxy joints, and Italian marble restoration.'),
('pooja-sawant', 'Pooja Sawant', 'BioSafe Eco Pest Management', 'Pest control', 'Andheri East, Mumbai', '7 years', 4.91, 82, 145, 'Non-toxic, odorless herbal baiting and pet-safe pest eradication solutions.')
ON CONFLICT (slug) DO UPDATE SET
  trade = EXCLUDED.trade,
  business = EXCLUDED.business,
  rating = EXCLUDED.rating,
  reviews = EXCLUDED.reviews,
  projects_count = EXCLUDED.projects_count,
  experience = EXCLUDED.experience,
  bio = EXCLUDED.bio;

-- Seed starting Gigs for each pro
INSERT INTO public.gigs (professional_id, name, description, starting_price, included, not_included, duration, materials, service_area, availability, addons, warranty)
SELECT p.id, g.name, g.description, g.price, g.inc, g.exc, g.dur, g.mat, g.area, g.avail, g.addons::jsonb, g.warranty
FROM public.professionals p
JOIN (VALUES
  ('vikram-sharma', 'AC Diagnostic Visit & Coil Jet Wash', 'Complete inspection of indoor/outdoor units, refrigerant pressure check, and antibacterial deep foam cleaning.', 499, ARRAY['Indoor & outdoor inspection', 'High-pressure jet wash', 'Gas pressure & current test'], ARRAY['Compressor replacement', 'Refrigerant top-up'], '1–2 hours', 'professional', 'Powai, Chandivali, Ghatkopar', 'Daily, 8 AM–8 PM', '[{"name":"R32 Gas Topup","price":900}]', '60 days cooling warranty'),
  ('imran-qureshi', 'AC Service & Leakage Repair', 'Fault isolation for warm air or indoor water dripping, drain pipe clearing, and capacitor health check.', 449, ARRAY['Leakage check', 'Drain pipe flush', 'Electrical circuit test'], ARRAY['New piping'], '1 hour', 'professional', 'Bandra, Khar, Santacruz', 'Daily, 9 AM–7 PM', '[{"name":"Dual Capacitor Replacement","price":550}]', '30 days warranty'),
  ('arjun-nair', 'Doorstep Plumbing Diagnosis', 'Diagnosis and repairs for leaking taps, concealed valve drips, and clogged kitchen/bath drains.', 499, ARRAY['Doorstep inspection', 'Gasket and washer fixes', 'Pressure test'], ARRAY['Major civil excavation', 'New fixtures'], '1 hour', 'customer', 'Andheri, Juhu, Vile Parle', 'Mon–Sat, 8 AM–8 PM', '[{"name":"Extra hour","price":300}]', '30 days on labour'),
  ('rohan-patil', 'Electrical Safety Check & MCB Balance', 'Full-home circuit continuity, earthing test, and distribution board load balance.', 399, ARRAY['Wiring continuity check', 'Thermal switch test', 'Written diagnosis'], ARRAY['Complete rewiring'], '1 hour', 'professional', 'Powai, Kanjurmarg, Vikhroli', 'Daily, 8 AM–8 PM', '[{"name":"Switchboard replace","price":250}]', '30 days on labour'),
  ('meera-shah', 'Carpentry & Wardrobe Consultation', 'On-site measurement, hardware adjustment, and custom storage CAD estimation.', 1499, ARRAY['Site inspection', 'Hinge & runner adjustments', 'Material shortlist'], ARRAY['Major ply fabrication'], '2 hours', 'help', 'Bandra, Khar, Juhu', 'Weekdays', '[{"name":"3D CAD drawing","price":2000}]', '6 months on craftsmanship'),
  ('sunil-verma', 'Wall Moisture & Painting Estimate', 'Laser moisture meter wall scan, primer assessment, and custom color swatch trial.', 899, ARRAY['Moisture meter scan', 'Putty assessment', 'Sample patch test'], ARRAY['Full room painting'], '2 hours', 'professional', 'Juhu, Santacruz, Bandra', 'Daily', '[]', '1 year warranty on paint adhesion'),
  ('dinesh-kulkarni', 'Waterproofing Barrier Inspection', 'Infrared and moisture inspection of ceiling dampness, joint raking, and seepage barrier estimate.', 1200, ARRAY['Moisture mapping', 'Polymer raking trial', 'Written warranty plan'], ARRAY['Full terrace screeding'], '2 hours', 'professional', 'Thane, Mulund, Bhandup', 'Mon–Sat', '[]', '10-year leak guarantee'),
  ('ramesh-yadav', 'Tile Levelling & Grout Assessment', 'Tile hollow-spot detection, laser leveling, and epoxy joint consultation.', 999, ARRAY['Hollow sound test', 'Laser level check', 'Epoxy color match'], ARRAY['Tile dismantling'], '2 hours', 'professional', 'Goregaon, Malad, Kandivali', 'Daily', '[]', '90 days on levelling'),
  ('pooja-sawant', 'Eco Herbal Pest Treatment', 'Odorless kitchen cabinet gel baiting and child/pet-safe perimeter barrier treatment.', 799, ARRAY['Kitchen gel baiting', 'Drain trap treatment', '30-day follow-up'], ARRAY['Heavy structural fumigation'], '1–2 hours', 'professional', 'Andheri, Jogeshwari, Vile Parle', 'Daily', '[]', '90 days pest-free warranty')
) AS g(slug, name, description, price, inc, exc, dur, mat, area, avail, addons, warranty)
ON g.slug = p.slug
ON CONFLICT DO NOTHING;

-- Seed verifications for each professional
ALTER TABLE public.karighar_verifications DROP CONSTRAINT IF EXISTS karighar_verifications_type_check;
ALTER TABLE public.karighar_verifications DROP CONSTRAINT IF EXISTS karighar_verifications_status_check;

INSERT INTO public.karighar_verifications (professional_id, type, status)
SELECT p.id, v.type, 'verified'
FROM public.professionals p
CROSS JOIN (VALUES
  ('identity'),
  ('background_check'),
  ('top_rated'),
  ('skills')
) AS v(type)
ON CONFLICT DO NOTHING;
