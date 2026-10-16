ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS detailed_brief jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.request_project_quote(_professional_id uuid, _title text, _summary text, _timing text, _location text, _budget text, _intent text, _brief jsonb, _gig_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; pro public.professionals; g public.gigs;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in to request a booking'; END IF;
 SELECT * INTO pro FROM public.professionals WHERE id = _professional_id;
 IF pro.id IS NULL THEN RAISE EXCEPTION 'Karighar not found'; END IF;
 IF pro.user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot book your own storefront'; END IF;
 IF length(trim(_title)) = 0 THEN RAISE EXCEPTION 'A project title is required'; END IF;
 IF _gig_id IS NOT NULL THEN
 SELECT * INTO g FROM public.gigs WHERE id = _gig_id AND professional_id = _professional_id AND is_published = true;
 IF g.id IS NULL THEN RAISE EXCEPTION 'This gig is no longer available'; END IF;
 END IF;
 IF _timing <> '' THEN
 IF _timing !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Choose a valid date'; END IF;
 IF _timing::date < current_date THEN RAISE EXCEPTION 'Choose today or a future date'; END IF;
 IF EXISTS (SELECT 1 FROM public.karighar_availability WHERE professional_id = _professional_id AND date = _timing::date AND status = 'blocked') THEN RAISE EXCEPTION 'This Karighar is unavailable on that date'; END IF;
 IF EXISTS (SELECT 1 FROM public.projects WHERE professional_id = _professional_id AND status IN ('scheduled','in_progress') AND left(timing,10) = _timing) THEN RAISE EXCEPTION 'That date is already booked'; END IF;
 END IF;
 INSERT INTO public.projects(customer_id,title,summary,timing,location,budget,intent,detailed_brief,gig_id,status,source) VALUES(auth.uid(),left(_title,200),left(_summary,10000),_timing,left(_location,300),left(_budget,200),left(_intent,30),COALESCE(_brief,'{}'::jsonb),_gig_id,'requested','quote') RETURNING id INTO pid;
 INSERT INTO public.quotes(project_id,professional_id,status) VALUES(pid,_professional_id,'requested');
 RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.request_project_quote(uuid,text,text,text,text,text,text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_project_quote(uuid,text,text,text,text,text,text,jsonb,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.accept_quote(_quote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.quotes; p public.projects;
BEGIN
 SELECT * INTO q FROM public.quotes WHERE id = _quote_id;
 IF q.id IS NULL OR NOT public.owns_project(q.project_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
 SELECT * INTO p FROM public.projects WHERE id = q.project_id FOR UPDATE;
 PERFORM 1 FROM public.professionals WHERE id = q.professional_id FOR UPDATE;
 SELECT * INTO q FROM public.quotes WHERE id = _quote_id FOR UPDATE;
 IF q.status <> 'submitted' OR p.status <> 'requested' THEN RAISE EXCEPTION 'Only submitted quotes on an open request can be accepted'; END IF;
 IF left(p.timing,10) ~ '^\d{4}-\d{2}-\d{2}$' THEN
 IF EXISTS (SELECT 1 FROM public.karighar_availability WHERE professional_id=q.professional_id AND date=left(p.timing,10)::date AND status='blocked') OR EXISTS (SELECT 1 FROM public.projects WHERE professional_id=q.professional_id AND id<>p.id AND status IN ('scheduled','in_progress') AND left(timing,10)=left(p.timing,10)) THEN RAISE EXCEPTION 'That date is no longer available. Please arrange another date'; END IF;
 END IF;
 UPDATE public.quotes SET status='accepted' WHERE id=q.id;
 UPDATE public.quotes SET status='declined' WHERE project_id=q.project_id AND id<>q.id;
 UPDATE public.projects SET professional_id=q.professional_id,price=q.total,status='scheduled' WHERE id=q.project_id;
END $$;
REVOKE ALL ON FUNCTION public.accept_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_quote(uuid) TO authenticated;