
-- Playbooks main table
CREATE TABLE public.playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  title text NOT NULL,
  description text,
  objective text,
  category text NOT NULL DEFAULT 'operacao',
  playbook_type text NOT NULL DEFAULT 'process',
  when_to_use text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  version_number integer NOT NULL DEFAULT 1,
  is_template boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Playbook phases
CREATE TABLE public.playbook_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id uuid REFERENCES public.playbooks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  relative_start_days integer DEFAULT 0,
  relative_duration_days integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Playbook steps (within phases)
CREATE TABLE public.playbook_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES public.playbook_phases(id) ON DELETE CASCADE NOT NULL,
  playbook_id uuid REFERENCES public.playbooks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  step_type text NOT NULL DEFAULT 'task',
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  relative_day_offset integer DEFAULT 0,
  assigned_role text,
  depends_on_step_id uuid REFERENCES public.playbook_steps(id) ON DELETE SET NULL,
  evidence_required text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Playbook applications (when a playbook is applied to an entity)
CREATE TABLE public.playbook_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  playbook_id uuid REFERENCES public.playbooks(id) ON DELETE SET NULL,
  playbook_version integer NOT NULL DEFAULT 1,
  applied_to_entity_type text NOT NULL,
  applied_to_entity_id text NOT NULL,
  applied_by text,
  status text NOT NULL DEFAULT 'in_progress',
  completed_steps integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Application step tracking
CREATE TABLE public.playbook_application_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.playbook_applications(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES public.playbook_steps(id) ON DELETE SET NULL,
  phase_title text,
  step_title text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  completed_by text,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_application_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_playbooks" ON public.playbooks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_playbook_phases" ON public.playbook_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_playbook_steps" ON public.playbook_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_playbook_apps" ON public.playbook_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_playbook_app_steps" ON public.playbook_application_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
