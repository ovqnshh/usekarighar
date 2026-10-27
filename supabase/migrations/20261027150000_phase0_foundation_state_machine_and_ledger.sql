-- ==============================================================================
-- KARIGHAR FOUNDATION PHASE 0 MIGRATION
-- State Machine, Immutable Event Sourcing, Double-Entry Ledger, and OTP Verification
-- ==============================================================================

-- 1. PLATFORM CONFIGURATION TABLE (Never hardcode pricing/commission)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admin manages platform settings" ON public.platform_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed initial system defaults
INSERT INTO public.platform_settings (key, value, description) VALUES
('commission_rates', '{"customer_fee_pct": 0.0, "pro_commission_pct": 0.15, "state_cess_pct": 0.015}'::jsonb, 'Platform commissions and statutory welfare cess'),
('escrow_policy', '{"auto_release_hours": 48, "dispute_window_hours": 24, "min_wallet_for_cod_paise": -250000}'::jsonb, 'Escrow release timers and negative wallet COD limits'),
('dispatch_config', '{"offer_timeout_seconds": 90, "max_search_radius_km": 10, "emergency_fee_paise": 49900}'::jsonb, 'Dispatch timeouts and SOS surge fees')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. CANONICAL PROJECT STATUS ENUM
DO $$ BEGIN
    CREATE TYPE public.project_lifecycle_status AS ENUM (
        'DRAFT',
        'SEARCHING',
        'ASSIGNED',
        'EN_ROUTE',
        'ARRIVED',
        'IN_PROGRESS',
        'COMPLETED',
        'SETTLED',
        'CANCELLED',
        'DISPUTED',
        'REWORK_SCHEDULED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_mode_enum AS ENUM ('ONLINE_ESCROW', 'COD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status_enum AS ENUM (
        'CREATED',
        'AUTHORISED',
        'HELD',
        'RELEASED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPGRADE OR CREATE CORE PROJECTS TABLE WITH PAISE & CANONICAL STATES
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS lifecycle_status public.project_lifecycle_status NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS payment_mode public.payment_mode_enum NOT NULL DEFAULT 'ONLINE_ESCROW',
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
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. IMMUTABLE PROJECT AUDIT TRAIL (Every transition writes exactly one row)
CREATE TABLE IF NOT EXISTS public.project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    from_status public.project_lifecycle_status,
    to_status public.project_lifecycle_status NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_events_project ON public.project_events(project_id, created_at);

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own project events" ON public.project_events FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_events.project_id AND (p.customer_id = auth.uid() OR p.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())))
);

-- 5. CRYPTOGRAPHIC 6-DIGIT OTP RECORD (Hashed, 10-min expiry, max 5 attempts)
CREATE TABLE IF NOT EXISTS public.project_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('START', 'END')),
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, kind)
);

ALTER TABLE public.project_otps ENABLE ROW LEVEL SECURITY;
-- Plain codes never read via API; verification happens strictly through server functions

-- 6. TYPED PROJECT MEDIA ATTACHMENTS (Enforcing BEFORE & AFTER evidence)
CREATE TABLE IF NOT EXISTS public.project_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('BEFORE', 'AFTER', 'MATERIAL', 'COMPLAINT', 'SITE')),
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    customer_consent_for_gallery BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_media_proj ON public.project_media(project_id, kind);
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project participants view media" ON public.project_media FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_media.project_id AND (p.customer_id = auth.uid() OR p.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())))
);
CREATE POLICY "Public views gallery approved media" ON public.project_media FOR SELECT USING (
    customer_consent_for_gallery = true AND kind IN ('BEFORE', 'AFTER')
);

-- 7. DOUBLE-ENTRY LEDGER (Single Source of Truth for all Rupee Movements)
DO $$ BEGIN
    CREATE TYPE public.ledger_account_type AS ENUM (
        'CUSTOMER',
        'ESCROW',
        'PLATFORM_REVENUE',
        'KARIGAR_WALLET',
        'KARIGAR_ADVANCE',
        'REFUNDS',
        'PAYOUT_BANK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    milestone_id UUID,
    account public.ledger_account_type NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    reason TEXT NOT NULL,
    ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_project ON public.ledger_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.ledger_entries(account, created_at);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read all ledger entries" ON public.ledger_entries FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. KARIGAR WALLETS (Reconciled derived balance)
CREATE TABLE IF NOT EXISTS public.karigar_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
    cached_balance_paise BIGINT NOT NULL DEFAULT 0,
    advance_balance_paise BIGINT NOT NULL DEFAULT 0,
    credit_tier TEXT NOT NULL DEFAULT 'standard' CHECK (credit_tier IN ('new', 'standard', 'silver', 'gold', 'elite')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.karigar_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Karigar views own wallet" ON public.karigar_wallets FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = karigar_wallets.professional_id AND p.user_id = auth.uid())
);

-- 9. PAYMENTS TABLE (Tracks online/gateway/manual UPI state)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID,
    provider TEXT NOT NULL DEFAULT 'ManualUpiProvider',
    provider_ref TEXT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    status public.payment_status_enum NOT NULL DEFAULT 'CREATED',
    method TEXT NOT NULL DEFAULT 'UPI',
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = payments.project_id AND (p.customer_id = auth.uid() OR p.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())))
);
