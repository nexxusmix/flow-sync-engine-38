-- Create exports bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to exports
CREATE POLICY "Exports are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports');

-- Allow authenticated users to upload exports
CREATE POLICY "Authenticated users can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exports' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their exports
CREATE POLICY "Authenticated users can delete exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'exports' AND auth.role() = 'authenticated');