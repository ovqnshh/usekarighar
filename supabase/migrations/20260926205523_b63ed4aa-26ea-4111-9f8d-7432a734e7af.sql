
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  business text NOT NULL,
  trade text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  rating numeric NOT NULL DEFAULT 5,
  reviews int NOT NULL DEFAULT 0,
  projects_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.professionals TO anon;
GRANT SELECT, INSERT, UPDATE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Users create own storefront" ON public.professionals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own storefront" ON public.professionals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.owns_professional(_pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.professionals WHERE id = _pid AND user_id = auth.uid())
$$;

CREATE TABLE public.gigs (
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
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gigs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gigs TO authenticated;
GRANT ALL ON public.gigs TO service_role;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gigs" ON public.gigs FOR SELECT USING (true);
CREATE POLICY "Owner inserts gigs" ON public.gigs FOR INSERT TO authenticated WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner updates gigs" ON public.gigs FOR UPDATE TO authenticated USING (public.owns_professional(professional_id)) WITH CHECK (public.owns_professional(professional_id));
CREATE POLICY "Owner deletes gigs" ON public.gigs FOR DELETE TO authenticated USING (public.owns_professional(professional_id));

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  intent text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  timing text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','scheduled','in_progress','complete')),
  source text NOT NULL DEFAULT 'quote' CHECK (source IN ('quote','gig')),
  professional_id uuid REFERENCES public.professionals(id),
  gig_id uuid REFERENCES public.gigs(id) ON DELETE SET NULL,
  price int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quotes (
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
GRANT SELECT, INSERT ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_project(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _id AND customer_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.pro_on_project(_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.quotes q JOIN public.professionals p ON p.id = q.professional_id WHERE q.project_id = _id AND p.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.projects pr JOIN public.professionals p ON p.id = pr.professional_id WHERE pr.id = _id AND p.user_id = auth.uid())
$$;

CREATE POLICY "Customer manages own projects" ON public.projects FOR ALL TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Professionals see related projects" ON public.projects FOR SELECT TO authenticated USING (public.pro_on_project(id));

CREATE POLICY "Customer views quotes on own projects" ON public.quotes FOR SELECT TO authenticated USING (public.owns_project(project_id));
CREATE POLICY "Professional views own quotes" ON public.quotes FOR SELECT TO authenticated USING (public.owns_professional(professional_id));
CREATE POLICY "Customer requests quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.owns_project(project_id) AND status = 'requested');

-- Demo storefronts (no owner account) auto-respond with a sample quote
CREATE OR REPLACE FUNCTION public.demo_quote_autofill() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.professionals;
BEGIN
  SELECT * INTO p FROM public.professionals WHERE id = NEW.professional_id;
  IF p.user_id IS NULL THEN
    NEW.status := 'submitted'; NEW.submitted_at := now();
    IF p.slug = 'arjun-nair' THEN
      NEW.labour := 1200; NEW.materials_cost := 650; NEW.transport := 150; NEW.other := 0; NEW.platform_fee := 99; NEW.tax := 180;
      NEW.duration := '1–2 hours'; NEW.workers := 1; NEW.materials := 'professional'; NEW.warranty := '90 days on labour and fittings';
      NEW.scope := 'Inspect the outlet, replace the leaking connector and seal, pressure-test and clean up.';
    ELSIF p.slug = 'meera-shah' THEN
      NEW.labour := 1600; NEW.materials_cost := 500; NEW.transport := 200; NEW.other := 150; NEW.platform_fee := 99; NEW.tax := 230;
      NEW.duration := 'Half day'; NEW.workers := 2; NEW.materials := 'help'; NEW.warranty := '6 months on workmanship';
      NEW.scope := 'Site assessment, material recommendations, full repair with finishing touches and a follow-up check.';
    ELSE
      NEW.labour := 950; NEW.materials_cost := 800; NEW.transport := 100; NEW.other := 0; NEW.platform_fee := 99; NEW.tax := 170;
      NEW.duration := '2–3 hours'; NEW.workers := 1; NEW.materials := 'customer'; NEW.warranty := '30 days on labour';
      NEW.scope := 'Repair as described using customer-supplied parts; testing and safety check included.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotes_demo_autofill BEFORE INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.demo_quote_autofill();

CREATE OR REPLACE FUNCTION public.submit_quote(_quote_id uuid, _labour int, _materials_cost int, _transport int, _other int, _platform_fee int, _tax int, _duration text, _workers int, _materials text, _warranty text, _scope text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id;
  IF q.id IS NULL OR NOT public.owns_professional(q.professional_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF q.status NOT IN ('requested','submitted') THEN RAISE EXCEPTION 'Quote can no longer be changed'; END IF;
  IF _materials NOT IN ('customer','professional','help') THEN RAISE EXCEPTION 'Invalid materials option'; END IF;
  UPDATE public.quotes SET labour = GREATEST(_labour,0), materials_cost = GREATEST(_materials_cost,0), transport = GREATEST(_transport,0), other = GREATEST(_other,0),
    platform_fee = GREATEST(_platform_fee,0), tax = GREATEST(_tax,0), duration = left(_duration,100), workers = GREATEST(_workers,1), materials = _materials,
    warranty = left(_warranty,300), scope = left(_scope,1000), status = 'submitted', submitted_at = now()
  WHERE id = _quote_id;
END $$;

CREATE OR REPLACE FUNCTION public.accept_quote(_quote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id;
  IF q.id IS NULL OR NOT public.owns_project(q.project_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF q.status <> 'submitted' THEN RAISE EXCEPTION 'Only submitted quotes can be accepted'; END IF;
  UPDATE public.quotes SET status = 'accepted' WHERE id = _quote_id;
  UPDATE public.quotes SET status = 'declined' WHERE project_id = q.project_id AND id <> _quote_id;
  UPDATE public.projects SET professional_id = q.professional_id, price = q.total, status = 'scheduled' WHERE id = q.project_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_quote FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_quote FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_quote TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_quote TO authenticated;

CREATE POLICY "Anyone reads gig photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'gig-photos');
CREATE POLICY "Users upload own gig photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gig-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own gig photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gig-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.professionals (slug, name, business, trade, city, experience, rating, reviews, projects_count, bio) VALUES
('arjun-nair','Arjun Nair','Nair Plumbing Works','Plumbing & water systems','Andheri West, Mumbai','12 years',4.92,128,214,'Clear assessments, written estimates and tidy work for Mumbai homes.'),
('meera-shah','Meera Shah','Studio Mitti','Renovation & interiors','Bandra, Mumbai','10 years',4.88,94,76,'Thoughtful renovations that respect how families actually live.'),
('rohan-patil','Rohan Patil','Circuit House Electricals','Electrical & lighting','Powai, Mumbai','8 years',4.81,67,143,'Safe, certified electrical work with no surprise costs.');

INSERT INTO public.gigs (professional_id, name, description, starting_price, included, not_included, duration, materials, service_area, availability, addons, warranty)
SELECT id, g.name, g.description, g.price, g.inc, g.exc, g.dur, g.mat, g.area, g.avail, g.addons::jsonb, g.warranty FROM public.professionals p
JOIN (VALUES
 ('arjun-nair','Home plumbing visit','Diagnosis and minor repairs for taps, leaks and drains.',899,ARRAY['Inspection','Minor fixes up to 1 hour','Clean-up'],ARRAY['Spare parts','Wall breaking'],'1 hour','customer','Andheri, Juhu, Goregaon','Mon–Sat, 9 AM–7 PM','[{"name":"Extra hour","price":400}]','30 days on labour'),
 ('arjun-nair','Water tank repair','Fix leaks, valves and pipe connections on overhead or loft tanks.',1299,ARRAY['Leak detection','Connector & seal replacement','Pressure test'],ARRAY['New tank','Civil work'],'1–2 hours','professional','Andheri, Juhu, Goregaon','Mon–Sat, 9 AM–7 PM','[{"name":"Tank cleaning","price":600}]','90 days on fittings'),
 ('meera-shah','Bathroom renovation consult','On-site consultation with layout, material and budget plan.',1499,ARRAY['Site visit','Layout sketch','Material shortlist'],ARRAY['Execution'],'2 hours','help','Bandra, Khar, Santacruz','Weekdays','[{"name":"3D render","price":2500}]','—'),
 ('rohan-patil','Electrical safety check','Full-home wiring, earthing and MCB inspection.',699,ARRAY['Wiring check','Earthing test','Written report'],ARRAY['Rewiring'],'1 hour','professional','Powai, Vikhroli, Chandivali','Daily, 8 AM–8 PM','[{"name":"Light fitting install","price":250}]','30 days on labour')
) AS g(slug,name,description,price,inc,exc,dur,mat,area,avail,addons,warranty) ON g.slug = p.slug;
