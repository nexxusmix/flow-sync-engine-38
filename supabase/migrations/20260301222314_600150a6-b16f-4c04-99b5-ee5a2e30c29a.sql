
CREATE TABLE public.instagram_insights_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id UUID NOT NULL,
  input_text TEXT,
  input_files JSONB DEFAULT '[]'::jsonb,
  command TEXT,
  report_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_type TEXT NOT NULL DEFAULT 'full',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_insights_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.instagram_insights_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON public.instagram_insights_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.instagram_insights_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_insights_reports_user ON public.instagram_insights_reports(user_id);
CREATE INDEX idx_insights_reports_created ON public.instagram_insights_reports(created_at DESC);
