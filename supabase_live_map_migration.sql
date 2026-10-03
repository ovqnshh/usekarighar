-- Create the professional_locations table for the Live Map feature
CREATE TABLE IF NOT EXISTS public.professional_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) NOT NULL UNIQUE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for this table so the map updates live
alter publication supabase_realtime add table public.professional_locations;

-- Enable RLS
ALTER TABLE public.professional_locations ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Anyone can view professional locations" ON public.professional_locations FOR SELECT USING (true);
CREATE POLICY "Pros can update their own location" ON public.professional_locations FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);
