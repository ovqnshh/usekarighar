-- ==============================================================================
-- KARIGHAR: ARTISAN REFERRAL REWARDS & MILESTONE CHALLENGES
-- ==============================================================================

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

-- Ensure idempotent columns
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
