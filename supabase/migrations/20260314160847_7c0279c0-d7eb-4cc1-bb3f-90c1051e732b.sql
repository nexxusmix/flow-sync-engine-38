
-- 1. Campaign Tasks (Collaboration Board)
CREATE TABLE public.instagram_campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date TEXT DEFAULT '',
  position INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_campaign_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_campaign_tasks" ON public.instagram_campaign_tasks
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_campaign_tasks" ON public.instagram_campaign_tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_campaign_tasks" ON public.instagram_campaign_tasks
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_campaign_tasks" ON public.instagram_campaign_tasks
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 2. Competitors
CREATE TABLE public.instagram_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT DEFAULT '',
  analysis JSONB DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_competitors" ON public.instagram_competitors
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_competitors" ON public.instagram_competitors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_competitors" ON public.instagram_competitors
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_competitors" ON public.instagram_competitors
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 3. Mood Board Items
CREATE TABLE public.instagram_mood_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  url TEXT DEFAULT NULL,
  color TEXT DEFAULT NULL,
  note TEXT DEFAULT NULL,
  label TEXT DEFAULT NULL,
  position INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_mood_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_mood_items" ON public.instagram_mood_items
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_mood_items" ON public.instagram_mood_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_mood_items" ON public.instagram_mood_items
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 4. Personas
CREATE TABLE public.instagram_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT DEFAULT '',
  pain TEXT DEFAULT '',
  desire TEXT DEFAULT '',
  objection TEXT DEFAULT '',
  funnel_stage TEXT NOT NULL DEFAULT 'tofu',
  linked_posts TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_personas" ON public.instagram_personas
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_personas" ON public.instagram_personas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_personas" ON public.instagram_personas
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_personas" ON public.instagram_personas
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 5. Automation Rules
CREATE TABLE public.instagram_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_automation_rules" ON public.instagram_automation_rules
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_automation_rules" ON public.instagram_automation_rules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_automation_rules" ON public.instagram_automation_rules
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_automation_rules" ON public.instagram_automation_rules
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
