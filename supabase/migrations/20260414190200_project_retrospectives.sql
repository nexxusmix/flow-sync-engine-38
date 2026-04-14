-- Project Retrospectives: AI-processed post-mortem report when a project is closed
CREATE TABLE public.project_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  closed_by UUID,
  reason TEXT NOT NULL,
  reason_category TEXT,
  user_notes TEXT,
  attachment_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Destructured for easier querying:
  overall_score INTEGER,
  client_satisfaction TEXT,
  team_performance TEXT,
  what_went_well JSONB DEFAULT '[]'::jsonb,
  what_went_wrong JSONB DEFAULT '[]'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  actions_for_next JSONB DEFAULT '[]'::jsonb,
  efficiency_metrics JSONB DEFAULT '{}'::jsonb,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pr_project ON public.project_retrospectives(project_id);
CREATE INDEX idx_pr_workspace ON public.project_retrospectives(workspace_id, created_at DESC);

ALTER TABLE public.project_retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_member_access" ON public.project_retrospectives
  FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "service_role_all" ON public.project_retrospectives
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
