-- Migration: Support SafePay doorstep escrow booking and quote management
-- Created: 2026-10-22

-- 1. Update quotes RLS policy to allow customers to request and accept quotes
DO $$ BEGIN
  DROP POLICY IF EXISTS "Customer requests quotes" ON public.quotes;
  CREATE POLICY "Customer requests quotes" ON public.quotes 
  FOR INSERT TO authenticated 
  WITH CHECK (public.owns_project(project_id) AND status IN ('requested', 'accepted'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Allow project participants (customer or professional) to manage messages
DO $$ BEGIN
  DROP POLICY IF EXISTS "Project participants view messages" ON public.messages;
  CREATE POLICY "Project participants view messages" ON public.messages 
  FOR SELECT TO authenticated 
  USING (
    public.owns_project(project_id) OR 
    public.pro_on_project(project_id) OR
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Project participants send messages" ON public.messages;
  CREATE POLICY "Project participants send messages" ON public.messages 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = sender_id AND (
      public.owns_project(project_id) OR 
      public.pro_on_project(project_id) OR
      EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.customer_id = auth.uid() OR p.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())))
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
