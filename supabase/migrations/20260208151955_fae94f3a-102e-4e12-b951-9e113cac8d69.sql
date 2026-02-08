-- Add new columns for version changelog and tags
ALTER TABLE public.portal_deliverable_versions
ADD COLUMN IF NOT EXISTS change_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS changelog_items JSONB DEFAULT '[]';

-- Add comment to explain the columns
COMMENT ON COLUMN public.portal_deliverable_versions.change_tags IS 'Tags resumidas do que mudou nesta versão (ex: cor, áudio, corte)';
COMMENT ON COLUMN public.portal_deliverable_versions.changelog_items IS 'Lista estruturada de tópicos alterados [{description: string, category?: string}]';