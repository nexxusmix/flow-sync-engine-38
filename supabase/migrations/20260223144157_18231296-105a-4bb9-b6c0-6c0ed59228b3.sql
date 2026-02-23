-- Make project-files bucket public so banner/logo images can be displayed
UPDATE storage.buckets SET public = true WHERE id = 'project-files';

-- Add storage policy for public read access
CREATE POLICY "Project files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');