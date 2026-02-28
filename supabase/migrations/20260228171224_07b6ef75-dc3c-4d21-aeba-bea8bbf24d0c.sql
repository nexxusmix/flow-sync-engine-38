
CREATE POLICY "Members can update project categories"
  ON public.project_file_categories FOR UPDATE
  USING (
    is_default = false
    AND project_id IS NOT NULL
    AND public.is_workspace_member(auth.uid())
  )
  WITH CHECK (
    is_default = false
    AND project_id IS NOT NULL
    AND public.is_workspace_member(auth.uid())
  );
