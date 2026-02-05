-- =====================================================
-- FASE 1: PROJECTS & PROJECT_STAGES TABLES
-- =====================================================

-- 1.1 Create projects table (CORE)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text DEFAULT 'default',
  name text NOT NULL,
  client_name text NOT NULL,
  description text,
  template text,
  status text CHECK (status IN ('active', 'paused', 'completed', 'archived')) DEFAULT 'active',
  stage_current text NOT NULL DEFAULT 'briefing',
  health_score int DEFAULT 100,
  contract_value numeric DEFAULT 0,
  has_payment_block boolean DEFAULT false,
  start_date date,
  due_date date,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_stage_current ON public.projects(stage_current);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);

-- 1.2 Create project_stages table (Timeline detalhada)
CREATE TABLE IF NOT EXISTS public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  stage_key text NOT NULL,
  title text NOT NULL,
  order_index int NOT NULL,
  status text CHECK (status IN ('not_started', 'in_progress', 'done', 'blocked')) DEFAULT 'not_started',
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, stage_key)
);

-- Index for project_stages
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_status ON public.project_stages(status);

-- 1.3 Add event_type to calendar_events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'event_type'
  ) THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN event_type text CHECK (event_type IN ('meeting', 'deadline', 'delivery', 'task', 'milestone')) DEFAULT 'meeting';
  END IF;
END $$;

-- Add project_id reference to calendar_events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add deal_id reference to calendar_events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN deal_id uuid REFERENCES public.prospect_opportunities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- FASE 2: RLS POLICIES
-- =====================================================

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert_admin_operacao" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao')
  );

CREATE POLICY "projects_update_authorized" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao') OR
    public.has_app_role(auth.uid(), 'financeiro')
  )
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao') OR
    public.has_app_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE TO authenticated
  USING (public.has_app_role(auth.uid(), 'admin'));

-- Enable RLS on project_stages
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Project stages policies
CREATE POLICY "project_stages_select_authenticated" ON public.project_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_stages_insert_admin_operacao" ON public.project_stages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao')
  );

CREATE POLICY "project_stages_update_admin_operacao" ON public.project_stages
  FOR UPDATE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao')
  );

CREATE POLICY "project_stages_delete_admin_operacao" ON public.project_stages
  FOR DELETE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'operacao')
  );

-- =====================================================
-- FASE 3: TRIGGERS
-- =====================================================

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 4: UPDATE PROSPECT_OPPORTUNITIES RLS
-- =====================================================

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "prospect_opportunities_select" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "prospect_opportunities_insert" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "prospect_opportunities_update" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "prospect_opportunities_delete" ON public.prospect_opportunities;

CREATE POLICY "prospect_opportunities_select" ON public.prospect_opportunities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "prospect_opportunities_insert" ON public.prospect_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

CREATE POLICY "prospect_opportunities_update" ON public.prospect_opportunities
  FOR UPDATE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

CREATE POLICY "prospect_opportunities_delete" ON public.prospect_opportunities
  FOR DELETE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

-- =====================================================
-- FASE 5: UPDATE PROSPECT_ACTIVITIES RLS  
-- =====================================================

DROP POLICY IF EXISTS "prospect_activities_select" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_insert" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_update" ON public.prospect_activities;
DROP POLICY IF EXISTS "prospect_activities_delete" ON public.prospect_activities;

CREATE POLICY "prospect_activities_select" ON public.prospect_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "prospect_activities_insert" ON public.prospect_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

CREATE POLICY "prospect_activities_update" ON public.prospect_activities
  FOR UPDATE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

CREATE POLICY "prospect_activities_delete" ON public.prospect_activities
  FOR DELETE TO authenticated
  USING (
    public.has_app_role(auth.uid(), 'admin') OR 
    public.has_app_role(auth.uid(), 'comercial')
  );

-- Enable realtime for projects
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_stages;