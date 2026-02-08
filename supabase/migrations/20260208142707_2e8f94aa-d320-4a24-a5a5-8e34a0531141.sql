-- =============================================
-- PROJECT INTERACTIONS MODULE
-- Meetings, Client Requests, Messages, Alignments
-- =============================================

-- Main interactions table
CREATE TABLE public.project_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  type TEXT NOT NULL CHECK (type IN ('reuniao', 'pedido_cliente', 'mensagem_cliente', 'alinhamento_interno')),
  title TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT CHECK (source IN ('whatsapp', 'meet', 'zoom', 'presencial', 'email', 'outro')),
  participants TEXT,
  transcript TEXT,
  notes_internal TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.project_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "auth_interactions_select" ON public.project_interactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_interactions_insert" ON public.project_interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_interactions_update" ON public.project_interactions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_interactions_delete" ON public.project_interactions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Updated at trigger
CREATE TRIGGER update_project_interactions_updated_at
  BEFORE UPDATE ON public.project_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_project_interactions_project ON public.project_interactions(project_id);
CREATE INDEX idx_project_interactions_occurred ON public.project_interactions(occurred_at DESC);

-- =============================================
-- INTERACTION ASSETS (attachments/links)
-- =============================================

CREATE TABLE public.project_interaction_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.project_interactions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('file', 'link')),
  storage_path TEXT,
  url TEXT,
  filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_interaction_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_interaction_assets_select" ON public.project_interaction_assets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_interaction_assets_insert" ON public.project_interaction_assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_interaction_assets_delete" ON public.project_interaction_assets
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_interaction_assets_interaction ON public.project_interaction_assets(interaction_id);

-- =============================================
-- INTERACTION SUMMARIES (AI-generated)
-- =============================================

CREATE TABLE public.project_interaction_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.project_interactions(id) ON DELETE CASCADE UNIQUE,
  summary_bullets JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  deadlines JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ai_run_id UUID
);

ALTER TABLE public.project_interaction_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_summaries_select" ON public.project_interaction_summaries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_summaries_insert" ON public.project_interaction_summaries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_summaries_update" ON public.project_interaction_summaries
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_summaries_delete" ON public.project_interaction_summaries
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_summaries_interaction ON public.project_interaction_summaries(interaction_id);

-- =============================================
-- PROJECT ACTION ITEMS (extracted deadlines/tasks)
-- =============================================

CREATE TABLE public.project_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.project_interactions(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.project_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_action_items_select" ON public.project_action_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_action_items_insert" ON public.project_action_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_action_items_update" ON public.project_action_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_action_items_delete" ON public.project_action_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_project_action_items_updated_at
  BEFORE UPDATE ON public.project_action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_action_items_project ON public.project_action_items(project_id);
CREATE INDEX idx_action_items_due ON public.project_action_items(due_date);
CREATE INDEX idx_action_items_status ON public.project_action_items(status);

-- =============================================
-- ENABLE REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_action_items;