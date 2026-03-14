
-- Add recurrence and trend columns to client_feedback
ALTER TABLE public.client_feedback 
  ADD COLUMN IF NOT EXISTS feedback_context text DEFAULT 'checkpoint',
  ADD COLUMN IF NOT EXISTS cycle_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_rating integer,
  ADD COLUMN IF NOT EXISTS trend_direction text DEFAULT 'stable';

-- Create index for efficient trend queries
CREATE INDEX IF NOT EXISTS idx_client_feedback_project_submitted 
  ON public.client_feedback(project_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_feedback_portal_link 
  ON public.client_feedback(portal_link_id, submitted_at DESC);
