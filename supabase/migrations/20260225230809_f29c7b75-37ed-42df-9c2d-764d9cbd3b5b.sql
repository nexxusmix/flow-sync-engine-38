
-- Add project_id to tasks table
ALTER TABLE public.tasks ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Index for filtering
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
