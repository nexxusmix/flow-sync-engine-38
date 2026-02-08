-- Add project art columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create storage bucket for project files if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project files
CREATE POLICY "Anyone can view project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');