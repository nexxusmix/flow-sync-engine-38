
-- Fase 6B: Assignee field on tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);

-- Fase 7A: Task templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'operacao',
  priority TEXT DEFAULT 'normal',
  tags TEXT[] DEFAULT '{}',
  checklist_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates"
  ON public.task_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fase 8A: Task dependencies table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage dependencies on their own tasks
CREATE POLICY "Users manage own task dependencies"
  ON public.task_dependencies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_dependencies.task_id AND tasks.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_dependencies.task_id AND tasks.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON public.task_dependencies(depends_on_task_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;
