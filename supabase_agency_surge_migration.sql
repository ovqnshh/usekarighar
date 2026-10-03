-- 1. Modify Job Requests for Urgent Surge Pricing
ALTER TABLE public.job_requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 2. Modify Projects for Agency Mode
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_member_id UUID;

-- 3. Agency Members Table
CREATE TABLE IF NOT EXISTS public.agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Helper',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Agency Members
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Professionals can manage their own agency members
CREATE POLICY "Pros can view their agency members" ON public.agency_members FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);
CREATE POLICY "Pros can insert agency members" ON public.agency_members FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);
CREATE POLICY "Pros can delete agency members" ON public.agency_members FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);

-- Customers can view assigned member
CREATE POLICY "Customers can view assigned member" ON public.agency_members FOR SELECT USING (
    id IN (SELECT assigned_member_id FROM public.projects WHERE customer_id = auth.uid())
);
