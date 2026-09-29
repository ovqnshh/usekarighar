-- 1. Add social links to professionals table
ALTER TABLE public.professionals 
  ADD COLUMN IF NOT EXISTS youtube_link text,
  ADD COLUMN IF NOT EXISTS instagram_link text,
  ADD COLUMN IF NOT EXISTS website_link text;

-- 2. Create portfolio_images table
CREATE TABLE IF NOT EXISTS public.portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.portfolio_images TO anon;
GRANT ALL ON public.portfolio_images TO authenticated;

CREATE POLICY "Public can view portfolio images" ON public.portfolio_images FOR SELECT USING (true);
CREATE POLICY "Professionals can manage own portfolio images" ON public.portfolio_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.professionals WHERE id = professional_id AND user_id = auth.uid())
);

-- 3. Create Storage Bucket for Portfolios
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolios', 'portfolios', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'portfolios');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolios' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolios' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'portfolios' AND auth.uid() = owner);