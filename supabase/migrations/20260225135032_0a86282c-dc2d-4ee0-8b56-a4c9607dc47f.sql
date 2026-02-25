
-- Add recurrence fields to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_rule text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid DEFAULT NULL REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Create task checklist items table (subtasks)
CREATE TABLE public.task_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own task checklist items"
ON public.task_checklist_items FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_checklist_items.task_id AND tasks.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_checklist_items.task_id AND tasks.user_id = auth.uid())
);

-- Create task comments table
CREATE TABLE public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own task comments"
ON public.task_comments FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

-- Index for performance
CREATE INDEX idx_task_checklist_task_id ON public.task_checklist_items(task_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_tasks_recurrence_parent ON public.tasks(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
