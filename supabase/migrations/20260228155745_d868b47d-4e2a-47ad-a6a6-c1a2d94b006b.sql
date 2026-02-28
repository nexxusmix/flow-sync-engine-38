
-- Store synced Instagram insights
CREATE TABLE public.instagram_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  connection_id UUID NOT NULL REFERENCES public.instagram_connections(id) ON DELETE CASCADE,
  media_id TEXT,
  media_type TEXT,
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  period TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace insights"
  ON public.instagram_insights FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Service can insert insights"
  ON public.instagram_insights FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE INDEX idx_instagram_insights_connection ON public.instagram_insights(connection_id);
CREATE INDEX idx_instagram_insights_media ON public.instagram_insights(media_id, metric_name);
CREATE INDEX idx_instagram_insights_collected ON public.instagram_insights(collected_at DESC);
