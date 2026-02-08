-- Add fields for client uploads on portal_deliverables
ALTER TABLE portal_deliverables 
ADD COLUMN IF NOT EXISTS uploaded_by_client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_upload_name text,
ADD COLUMN IF NOT EXISTS material_category text DEFAULT 'deliverable';

-- Create index for faster client upload queries
CREATE INDEX IF NOT EXISTS idx_portal_deliverables_client_upload 
ON portal_deliverables(portal_link_id, uploaded_by_client) 
WHERE uploaded_by_client = true;

-- Update RLS to allow client inserts via portal token
-- First drop if exists to recreate
DROP POLICY IF EXISTS "Allow client upload via portal" ON portal_deliverables;

-- Create policy for client uploads
CREATE POLICY "Allow client upload via portal"
ON portal_deliverables
FOR INSERT
WITH CHECK (
  uploaded_by_client = true AND
  EXISTS (
    SELECT 1 FROM portal_links 
    WHERE portal_links.id = portal_deliverables.portal_link_id 
    AND portal_links.is_active = true
  )
);