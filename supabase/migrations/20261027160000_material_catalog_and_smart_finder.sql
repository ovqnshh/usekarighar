-- ==============================================================================
-- KARIGHAR PROMPT 1: MATERIAL CATALOG & SMART PART FINDER MIGRATION
-- Supports pg_trgm (fuzzy/lexical) & pgvector (semantic embedding)
-- ==============================================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create material_catalog table
CREATE TABLE IF NOT EXISTS public.material_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    spec TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    typical_use TEXT NOT NULL,
    mrp_paise BIGINT NOT NULL CHECK (mrp_paise > 0),
    trade_price_min_paise BIGINT NOT NULL CHECK (trade_price_min_paise > 0),
    trade_price_max_paise BIGINT NOT NULL CHECK (trade_price_max_paise >= trade_price_min_paise),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT NOT NULL DEFAULT 'admin_verified',
    city TEXT NOT NULL DEFAULT 'Mumbai',
    embedding vector(768), -- Dimension for text-embedding-004
    search_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to safely compute search_text without 42P17 generation expression is not immutable error
CREATE OR REPLACE FUNCTION public.compute_material_catalog_search_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_text := coalesce(NEW.name, '') || ' ' || coalesce(NEW.brand, '') || ' ' || array_to_string(coalesce(NEW.aliases, '{}'), ' ') || ' ' || coalesce(NEW.description, '') || ' ' || coalesce(NEW.typical_use, '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_catalog_search_text ON public.material_catalog;
CREATE TRIGGER trg_material_catalog_search_text
    BEFORE INSERT OR UPDATE ON public.material_catalog
    FOR EACH ROW EXECUTE FUNCTION public.compute_material_catalog_search_text();

-- 3. Indexes for instant Stage A search
CREATE INDEX IF NOT EXISTS idx_material_catalog_name_trgm ON public.material_catalog USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_material_catalog_aliases ON public.material_catalog USING gin (aliases);
CREATE INDEX IF NOT EXISTS idx_material_catalog_search_fts ON public.material_catalog USING gin (to_tsvector('english', search_text));

-- 4. Vector index for Stage B semantic retrieval (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_material_catalog_embedding ON public.material_catalog USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 5. Part search logs table (captures helpfulness, queries, and improvements)
CREATE TABLE IF NOT EXISTS public.part_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    matched_ids UUID[] NOT NULL DEFAULT '{}',
    chosen_id UUID REFERENCES public.material_catalog(id) ON DELETE SET NULL,
    confidence NUMERIC(4,3),
    was_helpful BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_search_logs_query ON public.part_search_logs(query);

-- 6. Row Level Security
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads verified material catalog" ON public.material_catalog FOR SELECT USING (true);

ALTER TABLE public.part_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public creates search logs" ON public.part_search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public updates helpfulness on own log" ON public.part_search_logs FOR UPDATE USING (true);
