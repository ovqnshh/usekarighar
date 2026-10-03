-- 1. Messages Table for In-App Chat & Negotiation
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_special_offer BOOLEAN DEFAULT false,
    offer_amount NUMERIC, -- If it's a special offer, this is the price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages
-- Users can view messages for projects they are a part of (either as customer or the assigned professional)
CREATE POLICY "Users can view project messages" ON public.messages FOR SELECT USING (
    auth.uid() IN (SELECT customer_id FROM public.projects WHERE id = project_id) OR
    auth.uid() IN (SELECT p.user_id FROM public.projects proj JOIN public.professionals p ON p.id = proj.professional_id WHERE proj.id = project_id)
);

-- Users can insert messages for projects they are a part of
CREATE POLICY "Users can insert project messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT customer_id FROM public.projects WHERE id = project_id) OR
    auth.uid() IN (SELECT p.user_id FROM public.projects proj JOIN public.professionals p ON p.id = proj.professional_id WHERE proj.id = project_id)
);
