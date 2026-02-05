-- Storage bucket para arquivos de projeto
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Tabela de arquivos do projeto
CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  folder text NOT NULL DEFAULT 'outros',
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  visible_in_portal boolean DEFAULT false,
  uploaded_by uuid,
  uploaded_by_name text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabela de links do portal do cliente
CREATE TABLE IF NOT EXISTS public.portal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  block_if_unpaid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  regenerated_at timestamptz
);

-- Tabela de atividades do cliente no portal
CREATE TABLE IF NOT EXISTS public.portal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_link_id uuid NOT NULL REFERENCES portal_links(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS para project_files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_project_files_all" ON project_files
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_portal_files_select" ON project_files
  FOR SELECT TO anon USING (visible_in_portal = true);

-- RLS para portal_links
ALTER TABLE portal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_portal_links_all" ON portal_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_portal_links_select" ON portal_links
  FOR SELECT TO anon USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS para portal_activities
ALTER TABLE portal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_portal_activities_all" ON portal_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_portal_activities_insert" ON portal_activities
  FOR INSERT TO anon WITH CHECK (true);

-- Storage policies para project-files bucket
CREATE POLICY "auth_storage_project_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "auth_storage_project_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "auth_storage_project_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "auth_storage_project_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "anon_storage_project_files_select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'project-files');