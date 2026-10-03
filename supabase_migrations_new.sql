-- 1. Job Requests (Reverse Marketplace)
CREATE TABLE IF NOT EXISTS public.job_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    materials_needed JSONB, -- e.g. ["1x PVC pipe", "Teflon tape"]
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'assigned', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Job Bids (Professionals bidding on requests)
CREATE TABLE IF NOT EXISTS public.job_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_request_id UUID REFERENCES public.job_requests(id) NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) NOT NULL,
    amount NUMERIC NOT NULL,
    eta_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Project Milestones (SafePay Escrow)
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    title TEXT NOT NULL,
    percentage INTEGER NOT NULL, -- e.g. 20 for 20%
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'funded', 'released'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for Job Requests
CREATE POLICY "Users can view all open job requests" ON public.job_requests FOR SELECT USING (status = 'open' OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own job requests" ON public.job_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job requests" ON public.job_requests FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Job Bids
CREATE POLICY "Users can view bids on their requests, pros can view their own bids" ON public.job_bids FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.job_requests WHERE id = job_request_id) OR
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);
CREATE POLICY "Pros can insert bids" ON public.job_bids FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);
CREATE POLICY "Users can accept bids" ON public.job_bids FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.job_requests WHERE id = job_request_id)
);

-- Policies for Project Milestones
CREATE POLICY "Users and assigned pros can view milestones" ON public.project_milestones FOR SELECT USING (
    auth.uid() IN (SELECT customer_id FROM public.projects WHERE id = project_id) OR
    auth.uid() IN (SELECT p.user_id FROM public.projects proj JOIN public.professionals p ON p.id = proj.professional_id WHERE proj.id = project_id)
);
CREATE POLICY "Users can update milestones (release funds)" ON public.project_milestones FOR UPDATE USING (
    auth.uid() IN (SELECT customer_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "System can insert milestones" ON public.project_milestones FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT customer_id FROM public.projects WHERE id = project_id)
);
