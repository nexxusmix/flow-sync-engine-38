-- Adicionar campos para anotações visuais nos comentários
ALTER TABLE public.portal_comments 
ADD COLUMN IF NOT EXISTS frame_timestamp_ms INTEGER,
ADD COLUMN IF NOT EXISTS annotation_data JSONB,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Índice para busca por deliverable
CREATE INDEX IF NOT EXISTS idx_portal_comments_deliverable 
ON public.portal_comments(deliverable_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_portal_comments_status 
ON public.portal_comments(status);

-- Índice para busca por prioridade
CREATE INDEX IF NOT EXISTS idx_portal_comments_priority 
ON public.portal_comments(priority);