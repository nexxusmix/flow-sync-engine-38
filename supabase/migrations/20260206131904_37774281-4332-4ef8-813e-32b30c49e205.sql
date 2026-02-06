-- Create content_metrics table for tracking publication performance
CREATE TABLE public.content_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_content_metrics_content_item_id ON public.content_metrics(content_item_id);
CREATE INDEX idx_content_metrics_workspace_id ON public.content_metrics(workspace_id);
CREATE INDEX idx_content_metrics_collected_at ON public.content_metrics(collected_at DESC);

-- Enable RLS
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies following project pattern
CREATE POLICY "auth_content_metrics_select" ON public.content_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_content_metrics_insert" ON public.content_metrics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_content_metrics_update" ON public.content_metrics
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_content_metrics_delete" ON public.content_metrics
  FOR DELETE USING (auth.uid() IS NOT NULL);