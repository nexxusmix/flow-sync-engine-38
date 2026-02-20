-- Create a public bucket for asset thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-thumbs', 'asset-thumbs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS: anyone can read public thumbs
CREATE POLICY "Public thumbs are readable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'asset-thumbs');

-- Service role can upload thumbs (edge functions use service role)
CREATE POLICY "Service role can upload thumbs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'asset-thumbs');

-- Also make project-files images viewable (authenticated)
CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');