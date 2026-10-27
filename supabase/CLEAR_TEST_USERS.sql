-- ============================================================================
-- SCRIPT 1: REMOVE ONLY MOCK DATA (PRESERVES YOUR REAL ACCOUNTS & PROFILES)
-- Run this in Supabase Dashboard -> SQL Editor to delete Arjun Nair, Meera Shah,
-- Rohan Patil, and all mock gigs/reviews while keeping your real account.
-- ============================================================================

BEGIN;

-- 1. Delete mock gigs attached to mock pros
DELETE FROM public.gigs 
WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NULL);

-- 2. Delete mock reviews
DELETE FROM public.reviews 
WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NULL)
   OR customer_id IS NULL;

-- 3. Delete any quotes/projects referencing mock pros
DELETE FROM public.quotes 
WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NULL);

DELETE FROM public.projects 
WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id IS NULL);

-- 4. Delete the 3 mock professionals (Arjun Nair, Meera Shah, Rohan Patil)
DELETE FROM public.professionals 
WHERE user_id IS NULL;

COMMIT;

-- Verify: Shows your real remaining professionals
SELECT id, name, business, trade, user_id FROM public.professionals;


-- ============================================================================
-- SCRIPT 2: COMPLETE 100% RESET (DELETES EVERYTHING: ALL USERS + MOCK DATA)
-- Run this if you want a completely empty, fresh database starting from 0.
-- ============================================================================
/*
BEGIN;

DELETE FROM public.messages;
DELETE FROM public.saved_karighars;
DELETE FROM public.quotes;
DELETE FROM public.projects;
DELETE FROM public.reviews;
DELETE FROM public.gigs;
DELETE FROM public.professionals;
DELETE FROM public.profiles;
DELETE FROM auth.users;

COMMIT;
*/
