-- Phase 2 through Phase 7 Core Managed Marketplace Schema Extension
-- Double-entry ledger, Wallets, Verification pipeline, Masked Calls, SOS Incidents, and Statutory Compliance

-- 1. Supply & Verification Pipeline (Tiered KYC)
CREATE TYPE public.kyc_tier_enum AS ENUM ('new', 'verified', 'elite');
CREATE TYPE public.verification_type_enum AS ENUM (
    'phone_otp', 
    'digilocker_aadhaar', 
    'pan', 
    'police_clearance', 
    'skill_assessment', 
    'practical_demo'
);
CREATE TYPE public.verification_status_enum AS ENUM ('pending', 'submitted', 'verified', 'rejected');

CREATE TABLE IF NOT EXISTS public.karigar_compliance_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
    kyc_tier public.kyc_tier_enum NOT NULL DEFAULT 'new',
    pan_number TEXT,
    digilocker_verified_name TEXT,
    police_verification_number TEXT,
    police_verified_at TIMESTAMPTZ,
    e_shram_uan TEXT, -- Statutory gig-worker registry identifier
    engagement_days_fy INT NOT NULL DEFAULT 0, -- Code on Social Security tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    type public.verification_type_enum NOT NULL,
    status public.verification_status_enum NOT NULL DEFAULT 'pending',
    doc_reference TEXT,
    verifier_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Dispatch Engine & Live Job Offers
CREATE TYPE public.dispatch_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');

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

-- 3. On-Site Job Evidence & Start OTP
CREATE TABLE IF NOT EXISTS public.job_on_site_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'start_otp', 'before_photo', 'after_photo', 'checklist_signoff'
    media_url TEXT,
    notes TEXT,
    verified_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Double-Entry Financial Ledger & Karigar Cash Wallet
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- e.g. '1001-CUST-ESCROW', '2001-PLATFORM-REV', '3001-PRO-PAYABLE'
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.karigar_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
    current_balance_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_deficit_limit_inr NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
    is_blocked_for_cash BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Trust, Safety & Emergency SOS
CREATE TYPE public.sos_severity_enum AS ENUM ('medium', 'high', 'critical');
CREATE TYPE public.sos_status_enum AS ENUM ('triggered', 'in_triage', 'police_alerted', 'resolved');

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

-- 6. Statutory Gig Worker Contribution Tracking (Code on Social Security 2025/2026)
CREATE TABLE IF NOT EXISTS public.statutory_welfare_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    gross_payout_inr NUMERIC(10, 2) NOT NULL,
    central_social_security_fee NUMERIC(10, 2) NOT NULL, -- 1.5% statutory contribution
    state_welfare_cess NUMERIC(10, 2) NOT NULL, -- 1% state welfare fee
    financial_year TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.karigar_compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_on_site_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karigar_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statutory_welfare_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ledger accounts" ON public.ledger_accounts FOR SELECT USING (true);
CREATE POLICY "Users read their own SOS" ON public.sos_incidents FOR ALL USING (auth.uid() = triggered_by);
