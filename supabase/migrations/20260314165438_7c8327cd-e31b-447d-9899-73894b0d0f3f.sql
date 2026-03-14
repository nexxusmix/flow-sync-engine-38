
-- 1. Content status history for SLA tracking
CREATE TABLE IF NOT EXISTS public.content_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  duration_minutes integer,
  notes text,
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_content_status_history" ON public.content_status_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_content_status_history_item ON public.content_status_history(content_item_id);

-- 2. Asset tags and associations
ALTER TABLE public.marketing_assets 
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_item_id uuid REFERENCES public.content_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description text;

-- 3. Content-to-portal bridge: link content items to portal deliverables
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS portal_delivery_id uuid,
  ADD COLUMN IF NOT EXISTS client_approval_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS client_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_feedback text;

-- 4. Content performance score (computed metric)
ALTER TABLE public.content_metrics
  ADD COLUMN IF NOT EXISTS engagement_rate numeric,
  ADD COLUMN IF NOT EXISTS performance_score integer;

-- 5. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_content_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO content_status_history (content_item_id, from_status, to_status, workspace_id)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_status_log ON public.content_items;
CREATE TRIGGER trg_content_status_log
  AFTER UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_status_change();
