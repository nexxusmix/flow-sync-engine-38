-- Project Health Snapshots: persisted AI-processed health analysis per project
CREATE TABLE public.project_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'healthy',
  executive_summary TEXT,
  delay_probability INTEGER,
  delay_severity TEXT,
  financial_risk TEXT,
  client_health TEXT,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  bottlenecks JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phs_project ON public.project_health_snapshots(project_id, created_at DESC);
CREATE INDEX idx_phs_workspace ON public.project_health_snapshots(workspace_id, created_at DESC);
CREATE INDEX idx_phs_status ON public.project_health_snapshots(workspace_id, status) WHERE status IN ('at_risk','critical');

ALTER TABLE public.project_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_member_read" ON public.project_health_snapshots
  FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "workspace_member_write" ON public.project_health_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "service_role_all" ON public.project_health_snapshots
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Helper view: latest snapshot per project
CREATE OR REPLACE VIEW public.project_health_latest AS
SELECT DISTINCT ON (project_id) *
FROM public.project_health_snapshots
ORDER BY project_id, created_at DESC;
