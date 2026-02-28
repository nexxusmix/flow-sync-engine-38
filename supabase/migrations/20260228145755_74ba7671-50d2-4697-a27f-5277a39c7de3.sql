
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
  PERFORM net.http_post(
    url := 'https://gfyeuhfapscxfvjnrssn.supabase.co/functions/v1/run-task-automations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeWV1aGZhcHNjeGZ2am5yc3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODY3OTEsImV4cCI6MjA4NTg2Mjc5MX0.GcimU4cwBUTiQHuGfSLQfEP_W2FaytVnpN9QuJTX8-E"}'::jsonb,
    body := _payload
  );

  RETURN NEW;
END;
$$;
