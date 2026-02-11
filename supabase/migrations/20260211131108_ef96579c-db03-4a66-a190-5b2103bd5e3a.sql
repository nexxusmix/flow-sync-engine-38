
-- 1) Criar tabela project_deliverables
CREATE TABLE public.project_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  workspace_id TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_deliverables_select" ON public.project_deliverables
  FOR SELECT USING (
    workspace_id = (SELECT workspace_id FROM public.projects WHERE id = project_id)
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "auth_deliverables_insert" ON public.project_deliverables
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "auth_deliverables_update" ON public.project_deliverables
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "auth_deliverables_delete" ON public.project_deliverables
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE TRIGGER update_project_deliverables_updated_at
  BEFORE UPDATE ON public.project_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Adicionar colunas em project_storyboards
ALTER TABLE public.project_storyboards
  ADD COLUMN IF NOT EXISTS deliverable_id UUID REFERENCES public.project_deliverables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_files JSONB DEFAULT '[]'::jsonb;
