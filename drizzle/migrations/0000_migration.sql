-- Widen status values to match what the app writes
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('draft','requested','requesting_quotes','quotes_received','scheduled','in_progress','complete','completed','cancelled'));
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text, phone text, city text,
  is_professional boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Saved Karighars
CREATE TABLE public.saved_karighars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_karighars TO authenticated;
GRANT ALL ON public.saved_karighars TO service_role;
ALTER TABLE public.saved_karighars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved read" ON public.saved_karighars FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own saved insert" ON public.saved_karighars FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own saved delete" ON public.saved_karighars FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customer reviews own project" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND project_id IS NOT NULL AND public.owns_project(project_id));

-- Verifications (written by staff only)
CREATE TABLE public.karighar_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.karighar_verifications TO anon, authenticated;
GRANT ALL ON public.karighar_verifications TO service_role;
ALTER TABLE public.karighar_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads verifications" ON public.karighar_verifications FOR SELECT USING (true);

-- Availability
CREATE TABLE public.karighar_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'blocked' CHECK (status IN ('blocked','available')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, date)
);
GRANT SELECT ON public.karighar_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.karighar_availability TO authenticated;
GRANT ALL ON public.karighar_availability TO service_role;
ALTER TABLE public.karighar_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads availability" ON public.karighar_availability FOR SELECT USING (true);
CREATE POLICY "Owner inserts availability" ON public.karighar_availability FOR INSERT TO authenticated WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner updates availability" ON public.karighar_availability FOR UPDATE TO authenticated USING (public.owns_professional(professional_id)) WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner deletes availability" ON public.karighar_availability FOR DELETE TO authenticated USING (public.owns_professional(professional_id));

-- Live location
CREATE TABLE public.professional_locations (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_locations TO authenticated;
GRANT ALL ON public.professional_locations TO service_role;
ALTER TABLE public.professional_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or their customers read location" ON public.professional_locations FOR SELECT TO authenticated USING (
  public.owns_professional(professional_id) OR EXISTS (SELECT 1 FROM public.projects p WHERE p.professional_id = professional_locations.professional_id AND p.customer_id = auth.uid() AND p.status IN ('scheduled','in_progress')));
CREATE POLICY "Owner writes location" ON public.professional_locations FOR INSERT TO authenticated WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner updates location" ON public.professional_locations FOR UPDATE TO authenticated USING (public.owns_professional(professional_id)) WITH CHECK (public.owns_professional(professional_id));

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  receiver_id uuid,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  is_special_offer boolean NOT NULL DEFAULT false,
  offer_amount integer,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_project_idx ON public.messages(project_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.owns_project(project_id) OR public.pro_on_project(project_id));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND (public.owns_project(project_id) OR public.pro_on_project(project_id)));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Agency team
CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'helper',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads team" ON public.agency_members FOR SELECT TO authenticated USING (public.owns_professional(professional_id));
CREATE POLICY "Owner adds team" ON public.agency_members FOR INSERT TO authenticated WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner removes team" ON public.agency_members FOR DELETE TO authenticated USING (public.owns_professional(professional_id));

-- Professional declines a quote request
CREATE OR REPLACE FUNCTION public.decline_quote(_quote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id;
  IF q.id IS NULL OR NOT public.owns_professional(q.professional_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF q.status NOT IN ('requested','submitted') THEN RAISE EXCEPTION 'Quote can no longer be changed'; END IF;
  UPDATE public.quotes SET status = 'declined' WHERE id = _quote_id;
END $$;