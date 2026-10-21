-- Migration: Dynamic Catalog Engine, 4 Pricing Modes, and Configurable Policy Framework
-- Created: 2026-10-21

-- 1. Configurable Policies Table (Zero Hardcoding)
CREATE TABLE IF NOT EXISTS public.config_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial configurable policies
INSERT INTO public.config_policies (key, value, description, category) VALUES
('COMMISSION_RATES', '{"default_rate": 0.15, "tier_discounts": {"new": 0.18, "verified": 0.15, "elite": 0.12}}'::jsonb, 'Platform commission fee scale based on Karigar tier', 'finance'),
('INSPECTION_FEES', '{"electrical": 199, "plumbing": 149, "carpentry": 199, "ac_appliance": 249, "general": 149}'::jsonb, 'Standard diagnosis inspection fee deductible on job acceptance', 'pricing'),
('CANCELLATION_POLICY', '{"free_window_minutes": 60, "late_cancel_customer_fee": 100, "late_cancel_karigar_penalty": 150}'::jsonb, 'Cancellation windows and penalties', 'operations'),
('DISPATCH_CONFIG', '{"offer_timeout_seconds": 45, "max_cascade_depth": 5, "search_radius_km": 12}'::jsonb, 'Automated dispatch timing and radius', 'dispatch'),
('CASH_WALLET_LIMITS', '{"max_deficit_inr": 2500, "warning_threshold_inr": 2000}'::jsonb, 'Maximum uncollected platform commission allowed before blocking cash gigs', 'finance'),
('ESCROW_CONFIG', '{"auto_release_hours": 48, "dispute_resolution_sla_hours": 24}'::jsonb, 'Escrow payout and dispute timing', 'finance'),
('GIG_WORKER_STATUTORY_CONTRIBUTION', '{"code_on_social_security_pct": 0.015, "state_welfare_cess_pct": 0.01}'::jsonb, 'Statutory contributions under Code on Social Security 2025/2026', 'compliance')
ON CONFLICT (key) DO NOTHING;

-- 2. Geographic Coverage: Cities & Zones
CREATE TABLE IF NOT EXISTS public.service_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.service_cities (name, state) VALUES
('Mumbai', 'Maharashtra'),
('Pune', 'Maharashtra'),
('Bengaluru', 'Karnataka'),
('Delhi NCR', 'Delhi')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.service_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES public.service_cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pincodes TEXT[] DEFAULT '{}',
    surge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Dynamic Catalog Engine: Categories -> Subcategories -> Services -> Variants
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

CREATE TABLE IF NOT EXISTS public.catalog_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT NOT NULL DEFAULT 'Hammer',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.pricing_mode_enum AS ENUM ('fixed_menu', 'visit_quote', 'milestone_escrow', 'hourly_rate');

CREATE TABLE IF NOT EXISTS public.catalog_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES public.catalog_subcategories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    pricing_mode public.pricing_mode_enum NOT NULL DEFAULT 'fixed_menu',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    visit_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estimated_duration_mins INT NOT NULL DEFAULT 60,
    warranty_days INT NOT NULL DEFAULT 30,
    required_kyc_tier TEXT NOT NULL DEFAULT 'verified',
    safety_risk_level TEXT NOT NULL DEFAULT 'standard', -- standard, high_voltage, height, hazardous
    whats_included TEXT[] DEFAULT '{}',
    whats_excluded TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.catalog_services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
    duration_delta_mins INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Standard Price Book for Transparent Consumable Spare Parts
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

-- Enable RLS
ALTER TABLE public.config_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_book_items ENABLE ROW LEVEL SECURITY;

-- Read policies for public/authenticated
CREATE POLICY "Public read active config policies" ON public.config_policies FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.service_cities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read zones" ON public.service_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Public read catalog categories" ON public.catalog_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read catalog subcategories" ON public.catalog_subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read catalog services" ON public.catalog_services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read catalog variants" ON public.catalog_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Public read price book" ON public.price_book_items FOR SELECT USING (true);
