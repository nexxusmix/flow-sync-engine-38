
-- Update the trigger function to use direct URL instead of app.settings
CREATE OR REPLACE FUNCTION public.fire_task_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event TEXT;
  _payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    _event := 'INSERT';
  ELSE
    -- Only fire on actual status change
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
  -- Reads anon key from Postgres setting (set via: ALTER DATABASE postgres SET app.supabase_anon_key = '<key>';)
  PERFORM net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/run-task-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
    ),
    body := _payload
  );

  RETURN NEW;
END;
$$;
