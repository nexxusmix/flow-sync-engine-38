
-- Creative Work References table
CREATE TABLE public.creative_work_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creative_work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  type TEXT NOT NULL DEFAULT 'url' CHECK (type IN ('youtube', 'figma', 'drive', 'url', 'file')),
  url TEXT,
  file_id UUID,
  title TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  use_for_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_work_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage references" ON public.creative_work_references
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_cw_refs_work_id ON public.creative_work_references(creative_work_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_work_references;
