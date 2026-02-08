-- Allow anonymous INSERT to event_logs (for portal visit logging)
DROP POLICY IF EXISTS "anon_event_logs_insert" ON public.event_logs;
CREATE POLICY "anon_event_logs_insert" 
ON public.event_logs 
FOR INSERT 
TO anon
WITH CHECK (true);