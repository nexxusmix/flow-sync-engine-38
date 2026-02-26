
-- Subtasks já foram criadas na migration anterior (rollback parcial pode ter aplicado)
-- Verificar se subtasks existe, se não, criar
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'Users manage own subtasks') THEN
    ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users manage own subtasks" ON public.subtasks FOR ALL
      USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.user_id = auth.uid()));
  END IF;
END $$;

-- Automação de tarefas
CREATE TABLE IF NOT EXISTS public.task_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'on_status_change',
  condition_json JSONB NOT NULL DEFAULT '{}',
  action_json JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_automation_rules' AND policyname = 'Users manage own automation rules') THEN
    ALTER TABLE public.task_automation_rules ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users manage own automation rules" ON public.task_automation_rules FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
