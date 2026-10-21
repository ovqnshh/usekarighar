-- ============================================================================
-- KARIGHAR: CLEAN ALL TEST/DEMO USERS & TRANSACTIONS (PRESERVES SHOWCASE PROS)
-- Safe to run in Supabase SQL Editor (Dashboard -> SQL Editor -> Run).
--
-- WHAT THIS DOES:
-- 1. Deletes all user accounts from auth.users and public.profiles.
-- 2. Deletes all user test projects, messages, user quotes, and shortlists.
-- 3. Deletes any user-registered pro storefronts (where user_id IS NOT NULL).
-- 4. PRESERVES all 9 showcase Karighar pros (Vikram, Arjun, Meera, etc.),
--    their mock reviews, portfolio images, price books, and catalog services!
--
-- NOTE: Uses dynamic EXECUTE statements so it never fails even if optional
-- compliance or marketplace migration tables have slightly different columns.
-- ============================================================================

BEGIN;

-- 1. Remove user-generated communications and test interactions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    EXECUTE 'DELETE FROM public.messages';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_karighars') THEN
    EXECUTE 'DELETE FROM public.saved_karighars';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shortlists') THEN
    EXECUTE 'DELETE FROM public.shortlists';
  END IF;
END $$;

-- 2. Remove user-created projects and associated quotes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quotes') THEN
    EXECUTE 'DELETE FROM public.quotes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
    EXECUTE 'DELETE FROM public.projects';
  END IF;
END $$;

-- 3. Remove user-generated reviews (Preserves mock reviews where customer_id IS NULL)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'customer_id'
    ) THEN
      EXECUTE 'DELETE FROM public.reviews WHERE customer_id IS NOT NULL';
    END IF;
  END IF;
END $$;

-- 4. Remove optional dispatch, ledger, and incident tables if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_incidents') THEN
    EXECUTE 'DELETE FROM public.sos_incidents';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dispatch_offers') THEN
    EXECUTE 'DELETE FROM public.dispatch_offers';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_on_site_evidence') THEN
    EXECUTE 'DELETE FROM public.job_on_site_evidence';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ledger_entries') THEN
    EXECUTE 'DELETE FROM public.ledger_entries';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ledger_transactions') THEN
    EXECUTE 'DELETE FROM public.ledger_transactions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_contracts') THEN
    EXECUTE 'DELETE FROM public.service_contracts';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    EXECUTE 'DELETE FROM public.bookings';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_wallets') THEN
    EXECUTE 'DELETE FROM public.customer_wallets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'statutory_welfare_contributions') THEN
    EXECUTE 'DELETE FROM public.statutory_welfare_contributions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'compliance_verification_records') THEN
    EXECUTE 'DELETE FROM public.compliance_verification_records';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'karigar_wallets') THEN
    EXECUTE 'DELETE FROM public.karigar_wallets';
  END IF;
END $$;

-- 5. Remove storefronts created by test users (Preserves the 9 showcase pros where user_id IS NULL)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    EXECUTE 'DELETE FROM public.agency_members WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'karighar_availability') THEN
    EXECUTE 'DELETE FROM public.karighar_availability WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'karighar_verifications') THEN
    EXECUTE 'DELETE FROM public.karighar_verifications WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professional_locations') THEN
    EXECUTE 'DELETE FROM public.professional_locations WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gigs') THEN
    EXECUTE 'DELETE FROM public.gigs WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'compliance_profiles') THEN
    EXECUTE 'DELETE FROM public.compliance_profiles WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;

  -- karigar_compliance_profiles: dynamically inspect column name to prevent 42703 errors
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'karigar_compliance_profiles' 
      AND column_name = 'professional_id'
  ) THEN
    EXECUTE 'DELETE FROM public.karigar_compliance_profiles WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'karigar_compliance_profiles' 
      AND column_name = 'karigar_id'
  ) THEN
    EXECUTE 'DELETE FROM public.karigar_compliance_profiles WHERE karigar_id IN (SELECT id FROM public.professionals WHERE user_id IS NOT NULL)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pro_applications') THEN
    EXECUTE 'DELETE FROM public.pro_applications';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professionals') THEN
    EXECUTE 'DELETE FROM public.professionals WHERE user_id IS NOT NULL';
  END IF;
END $$;

-- 6. Remove all user profiles from public.profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    EXECUTE 'DELETE FROM public.profiles';
  END IF;
END $$;

-- 7. Remove all authentication records from auth.users (cascades to identities, sessions, mfa, etc.)
DELETE FROM auth.users;

COMMIT;

-- 8. Verification summary: Return remaining counts
SELECT 
  (SELECT count(*) FROM auth.users) AS remaining_auth_users,
  (SELECT count(*) FROM public.profiles) AS remaining_profiles,
  (SELECT count(*) FROM public.projects) AS remaining_projects,
  (SELECT count(*) FROM public.professionals) AS preserved_showcase_pros,
  (SELECT count(*) FROM public.gigs) AS preserved_showcase_gigs,
  (SELECT count(*) FROM public.reviews) AS preserved_mock_reviews;
