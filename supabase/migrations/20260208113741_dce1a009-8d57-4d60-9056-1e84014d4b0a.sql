-- Create reference_links table for linking instagram_references to ideas/content
CREATE TABLE IF NOT EXISTS public.reference_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id UUID NOT NULL REFERENCES public.instagram_references(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('idea', 'content')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique link per reference + entity
  UNIQUE(reference_id, entity_type, entity_id)
);

-- Create index for faster lookups
CREATE INDEX idx_reference_links_entity ON public.reference_links(entity_type, entity_id);
CREATE INDEX idx_reference_links_reference ON public.reference_links(reference_id);

-- Enable RLS
ALTER TABLE public.reference_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all authenticated users for now, similar to instagram_references)
CREATE POLICY "Users can view all reference links"
  ON public.reference_links FOR SELECT
  USING (true);

CREATE POLICY "Users can insert reference links"
  ON public.reference_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete reference links"
  ON public.reference_links FOR DELETE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reference_links;