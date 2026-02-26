-- Deal activities / timeline
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'note', -- note, call, email, meeting, stage_change, follow_up, score_update
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view deal activities"
  ON public.deal_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can create deal activities"
  ON public.deal_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update own activities"
  ON public.deal_activities FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Members can delete own activities"
  ON public.deal_activities FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX idx_deal_activities_created_at ON public.deal_activities(created_at DESC);

-- Add lead_score and follow-up columns to crm_deals
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS lead_score_reasons JSONB DEFAULT '[]';
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS follow_up_due_at TIMESTAMPTZ;
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS stale_days INTEGER DEFAULT 0;

-- Auto-update last_activity_at when activity is created
CREATE OR REPLACE FUNCTION public.update_deal_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE crm_deals
  SET last_activity_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deal_activity_update
  AFTER INSERT ON public.deal_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_last_activity();

-- Enable realtime for deal_activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_activities;
