
-- Add template-related columns to content_items
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS template_id text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS template_fields jsonb;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS brand_kit_snapshot jsonb;
