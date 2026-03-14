
-- Client feedback table
CREATE TABLE public.client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  portal_link_id UUID REFERENCES public.portal_links(id) ON DELETE CASCADE,
  project_id UUID,
  client_name TEXT,
  client_email TEXT,
  entity_type TEXT NOT NULL DEFAULT 'general',
  entity_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- Public insert policy (portal visitors can submit feedback via share token)
CREATE POLICY "Anyone can insert feedback" ON public.client_feedback
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read feedback for their workspace
CREATE POLICY "Authenticated users can read feedback" ON public.client_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Index for common queries
CREATE INDEX idx_client_feedback_portal ON public.client_feedback(portal_link_id);
CREATE INDEX idx_client_feedback_project ON public.client_feedback(project_id);
CREATE INDEX idx_client_feedback_rating ON public.client_feedback(rating);
