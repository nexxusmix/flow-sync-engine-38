-- Fix overly permissive INSERT policy on asset-thumbs bucket
-- Service role bypasses RLS entirely, so we can safely drop the INSERT policy
-- (service role = edge functions; they don't need an RLS policy)
DROP POLICY IF EXISTS "Service role can upload thumbs" ON storage.objects;