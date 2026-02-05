-- =============================================
-- MÓDULO PROSPECÇÃO - SQUAD Hub
-- =============================================

-- A) prospect_lists (listas de contas alvo)
CREATE TABLE public.prospect_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prospect_lists" ON public.prospect_lists
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert prospect_lists" ON public.prospect_lists
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update prospect_lists" ON public.prospect_lists
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete prospect_lists" ON public.prospect_lists
  FOR DELETE USING (true);

-- B) prospects (targets)
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.prospect_lists(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  niche TEXT,
  city TEXT,
  region TEXT,
  instagram TEXT,
  website TEXT,
  linkedin TEXT,
  email TEXT,
  phone TEXT,
  decision_maker_name TEXT,
  decision_maker_role TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blacklisted')),
  tags TEXT[],
  notes TEXT,
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prospects" ON public.prospects
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert prospects" ON public.prospects
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update prospects" ON public.prospects
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete prospects" ON public.prospects
  FOR DELETE USING (true);

-- C) cadences (sequências de contato)
CREATE TABLE public.cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_niche TEXT,
  is_active BOOLEAN DEFAULT true,
  daily_limit INT DEFAULT 20,
  allowed_channels TEXT[] DEFAULT ARRAY['whatsapp', 'instagram', 'email', 'call'],
  rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all cadences" ON public.cadences
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert cadences" ON public.cadences
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update cadences" ON public.cadences
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete cadences" ON public.cadences
  FOR DELETE USING (true);

-- D) cadence_steps (passos da cadência)
CREATE TABLE public.cadence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  day_offset INT NOT NULL DEFAULT 0,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'email', 'call')),
  template TEXT NOT NULL,
  variations JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all cadence_steps" ON public.cadence_steps
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert cadence_steps" ON public.cadence_steps
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update cadence_steps" ON public.cadence_steps
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete cadence_steps" ON public.cadence_steps
  FOR DELETE USING (true);

-- E) prospect_opportunities (pipeline de prospecção)
CREATE TABLE public.prospect_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'conversation', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  estimated_value NUMERIC,
  probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  owner_name TEXT,
  owner_initials TEXT,
  next_action_at TIMESTAMPTZ,
  next_action_type TEXT CHECK (next_action_type IN ('dm', 'call', 'email', 'followup', 'meeting', 'proposal')),
  next_action_notes TEXT,
  lost_reason TEXT,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  linked_project_id TEXT,
  fit_score TEXT CHECK (fit_score IN ('high', 'medium', 'low')),
  objections TEXT[],
  conversation_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prospect_opportunities" ON public.prospect_opportunities
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert prospect_opportunities" ON public.prospect_opportunities
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update prospect_opportunities" ON public.prospect_opportunities
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete prospect_opportunities" ON public.prospect_opportunities
  FOR DELETE USING (true);

-- F) prospect_activities (atividades de follow-up)
CREATE TABLE public.prospect_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.prospect_opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('dm', 'call', 'email', 'meeting', 'note', 'followup', 'proposal')),
  channel TEXT CHECK (channel IN ('whatsapp', 'instagram', 'email', 'call', 'in_person')),
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  cadence_step_id UUID REFERENCES public.cadence_steps(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prospect_activities" ON public.prospect_activities
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert prospect_activities" ON public.prospect_activities
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can update prospect_activities" ON public.prospect_activities
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete prospect_activities" ON public.prospect_activities
  FOR DELETE USING (true);

-- G) do_not_contact (blacklist)
CREATE TABLE public.do_not_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prospect_id)
);

ALTER TABLE public.do_not_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all do_not_contact" ON public.do_not_contact
  FOR SELECT USING (true);
  
CREATE POLICY "Users can insert do_not_contact" ON public.do_not_contact
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete do_not_contact" ON public.do_not_contact
  FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_prospects_list_id ON public.prospects(list_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospect_opportunities_stage ON public.prospect_opportunities(stage);
CREATE INDEX idx_prospect_opportunities_prospect_id ON public.prospect_opportunities(prospect_id);
CREATE INDEX idx_prospect_activities_opportunity_id ON public.prospect_activities(opportunity_id);
CREATE INDEX idx_prospect_activities_due_at ON public.prospect_activities(due_at);
CREATE INDEX idx_prospect_activities_completed ON public.prospect_activities(completed);
CREATE INDEX idx_cadence_steps_cadence_id ON public.cadence_steps(cadence_id);