
-- Client Onboardings main table
CREATE TABLE public.client_onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  client_id text,
  client_name text NOT NULL,
  contract_id text,
  project_id text,
  template_name text,
  service_type text NOT NULL DEFAULT 'general',
  assigned_to uuid,
  status text NOT NULL DEFAULT 'in_progress',
  current_phase integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  completed_at timestamptz,
  notes text,
  ai_summary text,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding phases
CREATE TABLE public.onboarding_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES public.client_onboardings(id) ON DELETE CASCADE NOT NULL,
  phase_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding phase steps (checklists)
CREATE TABLE public.onboarding_phase_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES public.onboarding_phases(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  is_required boolean NOT NULL DEFAULT true,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  assigned_to uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Material / access requests
CREATE TABLE public.onboarding_material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES public.client_onboardings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'document',
  is_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  submitted_by text,
  validated_at timestamptz,
  validated_by uuid,
  file_url text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Briefing answers
CREATE TABLE public.onboarding_briefing_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES public.client_onboardings(id) ON DELETE CASCADE NOT NULL,
  question_key text NOT NULL,
  question_label text NOT NULL,
  answer text,
  section text DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.client_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_phase_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_briefing_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_onboardings" ON public.client_onboardings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_phases" ON public.onboarding_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_steps" ON public.onboarding_phase_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_materials" ON public.onboarding_material_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_briefing" ON public.onboarding_briefing_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
