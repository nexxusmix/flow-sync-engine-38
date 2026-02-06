-- Create content_assets table to link assets to content items
CREATE TABLE public.content_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT, -- image, video, audio, document
  file_size BIGINT,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);

-- Create index for faster lookups
CREATE INDEX idx_content_assets_content_item ON public.content_assets(content_item_id);
CREATE INDEX idx_content_assets_workspace ON public.content_assets(workspace_id);

-- Enable Row Level Security
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view content assets"
ON public.content_assets
FOR SELECT
USING (true);

CREATE POLICY "Users can insert content assets"
ON public.content_assets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete content assets"
ON public.content_assets
FOR DELETE
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.content_assets IS 'Links assets from marketing-assets bucket to content_items';