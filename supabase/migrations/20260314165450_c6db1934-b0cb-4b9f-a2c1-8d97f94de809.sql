
-- Fix RLS on content_status_history to use auth.uid()
DROP POLICY IF EXISTS "auth_content_status_history" ON public.content_status_history;
CREATE POLICY "auth_content_status_history_select" ON public.content_status_history
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_content_status_history_insert" ON public.content_status_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
