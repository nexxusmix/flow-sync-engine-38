
-- Table for AI-generated execution plans per task
CREATE TABLE public.task_execution_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  estimate_min INTEGER,
  estimate_max INTEGER,
  energy_level TEXT CHECK (energy_level IN ('baixa', 'media', 'alta')),
  next_action TEXT,
  micro_steps JSONB DEFAULT '[]'::jsonb,
  work_mode TEXT CHECK (work_mode IN ('deep_work', 'admin', 'criativo', 'comunicacao')),
  break_pattern TEXT DEFAULT '25/5',
  definition_of_done JSONB DEFAULT '[]'::jsonb,
  cognitive_load INTEGER DEFAULT 50 CHECK (cognitive_load BETWEEN 0 AND 100),
  suggested_time_slot TEXT,
  user_notes TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  emergency_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id)
);

-- Enable RLS
ALTER TABLE public.task_execution_plans ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access plans for their own tasks
CREATE POLICY "Users can view own task plans"
  ON public.task_execution_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_execution_plans.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can insert own task plans"
  ON public.task_execution_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_execution_plans.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can update own task plans"
  ON public.task_execution_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_execution_plans.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can delete own task plans"
  ON public.task_execution_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_execution_plans.task_id AND tasks.user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_task_execution_plans_updated_at
  BEFORE UPDATE ON public.task_execution_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_execution_plans;
