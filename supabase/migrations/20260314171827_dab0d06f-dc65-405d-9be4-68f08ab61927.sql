
-- Cross-entity timeline events table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  parent_entity_type text,
  parent_entity_id text,
  related_project_id text,
  event_type text NOT NULL DEFAULT 'update',
  title text NOT NULL,
  description text,
  status_from text,
  status_to text,
  visibility text NOT NULL DEFAULT 'internal',
  actor_id uuid,
  actor_name text,
  actor_type text DEFAULT 'user',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_timeline_events_entity ON public.timeline_events(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_timeline_events_parent ON public.timeline_events(parent_entity_type, parent_entity_id, created_at DESC);
CREATE INDEX idx_timeline_events_project ON public.timeline_events(related_project_id, created_at DESC);
CREATE INDEX idx_timeline_events_workspace ON public.timeline_events(workspace_id, created_at DESC);

-- Entity dependencies table
CREATE TABLE IF NOT EXISTS public.entity_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  source_entity_type text NOT NULL,
  source_entity_id text NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_id text NOT NULL,
  dependency_type text NOT NULL DEFAULT 'blocks',
  related_project_id text,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entity_deps_source ON public.entity_dependencies(source_entity_type, source_entity_id);
CREATE INDEX idx_entity_deps_target ON public.entity_dependencies(target_entity_type, target_entity_id);

-- Enable RLS
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read timeline events" ON public.timeline_events
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert timeline events" ON public.timeline_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public read for client-visible events" ON public.timeline_events
  FOR SELECT TO anon USING (visibility = 'client');

CREATE POLICY "Authenticated users can read dependencies" ON public.entity_dependencies
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage dependencies" ON public.entity_dependencies
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger function to auto-log task status changes
CREATE OR REPLACE FUNCTION public.log_task_timeline_event()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO timeline_events (entity_type, entity_id, parent_entity_type, parent_entity_id, related_project_id, event_type, title, status_from, status_to, visibility, actor_id, metadata)
    VALUES (
      'task', NEW.id,
      'project', NEW.project_id,
      NEW.project_id,
      'status_change',
      'Tarefa "' || LEFT(NEW.title, 80) || '" mudou para ' || NEW.status,
      OLD.status, NEW.status,
      'internal',
      NEW.user_id::uuid,
      jsonb_build_object('task_title', NEW.title, 'priority', NEW.priority)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_timeline
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_timeline_event();

-- Trigger function to auto-log project stage changes
CREATE OR REPLACE FUNCTION public.log_stage_timeline_event()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO timeline_events (entity_type, entity_id, parent_entity_type, parent_entity_id, related_project_id, event_type, title, status_from, status_to, visibility, metadata)
    VALUES (
      'stage', NEW.id,
      'project', NEW.project_id::text,
      NEW.project_id::text,
      'status_change',
      'Etapa "' || COALESCE(NEW.stage_name, NEW.stage_key) || '" mudou para ' || NEW.status,
      OLD.status, NEW.status,
      'client',
      jsonb_build_object('stage_key', NEW.stage_key, 'stage_name', NEW.stage_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stage_timeline
  AFTER UPDATE ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stage_timeline_event();
