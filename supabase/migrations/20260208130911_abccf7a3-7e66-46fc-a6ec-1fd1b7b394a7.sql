-- =============================================
-- PORTAL DO CLIENTE - VERSÕES E AJUSTES
-- =============================================

-- 1. Tabela de versões de entregas (timeline V1, V2, V3...)
CREATE TABLE IF NOT EXISTS public.portal_deliverable_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES public.portal_deliverables(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_name TEXT
);

-- 2. Tabela de solicitações de ajustes/alterações
CREATE TABLE IF NOT EXISTS public.portal_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID REFERENCES public.portal_deliverables(id) ON DELETE CASCADE,
  portal_link_id UUID NOT NULL REFERENCES public.portal_links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_role TEXT NOT NULL DEFAULT 'client' CHECK (author_role IN ('client', 'manager')),
  assigned_to TEXT,
  evidence_url TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Adicionar colunas de versão às entregas existentes
ALTER TABLE public.portal_deliverables 
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS awaiting_approval BOOLEAN DEFAULT false;

-- 4. Adicionar author_role aos comentários
ALTER TABLE public.portal_comments 
ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'client' CHECK (author_role IN ('client', 'manager'));

-- 5. Habilitar realtime nas tabelas do portal
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_deliverable_versions;

-- 6. Habilitar RLS
ALTER TABLE public.portal_deliverable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_change_requests ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Acesso anônimo via token válido
-- Portal deliverable versions - SELECT
CREATE POLICY "anon_portal_versions_select" ON public.portal_deliverable_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portal_deliverables pd
    JOIN public.portal_links pl ON pd.portal_link_id = pl.id
    WHERE pd.id = portal_deliverable_versions.deliverable_id
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
  )
);

-- Portal change requests - SELECT
CREATE POLICY "anon_portal_changes_select" ON public.portal_change_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portal_links pl
    WHERE pl.id = portal_change_requests.portal_link_id
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
  )
);

-- Portal change requests - INSERT (clientes podem criar ajustes)
CREATE POLICY "anon_portal_changes_insert" ON public.portal_change_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portal_links pl
    WHERE pl.id = portal_change_requests.portal_link_id
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
  )
);

-- Gestores autenticados podem fazer tudo nas tabelas do portal
CREATE POLICY "auth_portal_versions_all" ON public.portal_deliverable_versions
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_portal_changes_all" ON public.portal_change_requests
FOR ALL USING (auth.role() = 'authenticated');

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_portal_versions_deliverable ON public.portal_deliverable_versions(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_portal_changes_portal ON public.portal_change_requests(portal_link_id);
CREATE INDEX IF NOT EXISTS idx_portal_changes_status ON public.portal_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_portal_deliverables_link ON public.portal_deliverables(portal_link_id);

-- 9. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.portal_changes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_change_requests_updated
BEFORE UPDATE ON public.portal_change_requests
FOR EACH ROW EXECUTE FUNCTION public.portal_changes_updated_at();