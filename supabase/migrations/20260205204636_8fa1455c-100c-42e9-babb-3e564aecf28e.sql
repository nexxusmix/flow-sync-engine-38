-- Permite leitura anônima de arquivos visíveis no portal
-- quando o projeto tem um portal_link ativo
CREATE POLICY "anon_view_portal_files" ON project_files
  FOR SELECT TO anon
  USING (
    visible_in_portal = true
    AND EXISTS (
      SELECT 1 FROM portal_links pl
      WHERE pl.project_id::uuid = project_files.project_id
      AND pl.is_active = true
    )
  );

-- Adicionar coluna project_file_id na portal_comments para vincular a project_files
ALTER TABLE portal_comments
  ADD COLUMN project_file_id UUID REFERENCES project_files(id);

-- Adicionar coluna project_file_id na portal_approvals para vincular a project_files
ALTER TABLE portal_approvals
  ADD COLUMN project_file_id UUID REFERENCES project_files(id);

-- RLS para comentários - permitir leitura anônima de comentários de arquivos visíveis
CREATE POLICY "anon_view_comments_portal_files" ON portal_comments
  FOR SELECT TO anon
  USING (
    project_file_id IN (
      SELECT pf.id FROM project_files pf
      INNER JOIN portal_links pl ON pl.project_id::uuid = pf.project_id
      WHERE pf.visible_in_portal = true
      AND pl.is_active = true
    )
  );

-- RLS para inserir comentários em arquivos do portal
CREATE POLICY "anon_insert_comments_portal_files" ON portal_comments
  FOR INSERT TO anon
  WITH CHECK (
    project_file_id IN (
      SELECT pf.id FROM project_files pf
      INNER JOIN portal_links pl ON pl.project_id::uuid = pf.project_id
      WHERE pf.visible_in_portal = true
      AND pl.is_active = true
    )
  );

-- RLS para aprovações - permitir leitura anônima
CREATE POLICY "anon_view_approvals_portal_files" ON portal_approvals
  FOR SELECT TO anon
  USING (
    project_file_id IN (
      SELECT pf.id FROM project_files pf
      INNER JOIN portal_links pl ON pl.project_id::uuid = pf.project_id
      WHERE pf.visible_in_portal = true
      AND pl.is_active = true
    )
  );

-- RLS para inserir aprovações em arquivos do portal
CREATE POLICY "anon_insert_approvals_portal_files" ON portal_approvals
  FOR INSERT TO anon
  WITH CHECK (
    project_file_id IN (
      SELECT pf.id FROM project_files pf
      INNER JOIN portal_links pl ON pl.project_id::uuid = pf.project_id
      WHERE pf.visible_in_portal = true
      AND pl.is_active = true
    )
  );