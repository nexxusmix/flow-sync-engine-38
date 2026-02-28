
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to fire task automations via edge function
CREATE OR REPLACE FUNCTION public.fire_task_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event TEXT;
  _payload JSONB;
  _url TEXT;
  _anon_key TEXT;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    _event := 'INSERT';
  ELSE
    -- Only fire on status change
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
    _event := 'UPDATE';
  END IF;

  -- Build payload
  _payload := jsonb_build_object(
    'event', _event,
    'task_id', NEW.id,
    'user_id', NEW.user_id,
    'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    'new_status', NEW.status,
    'category', NEW.category,
    'priority', NEW.priority,
    'tags', to_jsonb(COALESCE(NEW.tags, '{}'::text[])),
    'title', NEW.title
  );

  -- Call edge function asynchronously via pg_net
  _url := current_setting('app.settings.supabase_url', true) ||
          '/functions/v1/run-task-automations';
  _anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- Use net.http_post to call the function async (fire-and-forget)
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := _payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS trg_task_automation ON public.tasks;
CREATE TRIGGER trg_task_automation
  AFTER INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.fire_task_automation();
