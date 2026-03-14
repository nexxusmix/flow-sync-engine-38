
-- AB Tests table for Instagram Engine
CREATE TABLE public.instagram_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  post_id UUID NOT NULL,
  name TEXT NOT NULL,
  field TEXT NOT NULL DEFAULT 'hook',
  variant_a TEXT NOT NULL DEFAULT '',
  variant_b TEXT NOT NULL DEFAULT '',
  winner TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  notes TEXT,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_member_access" ON public.instagram_ab_tests
  FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));
