
-- =============================================
-- 1) Function: Auto-block/unblock project based on overdue revenues
-- =============================================
CREATE OR REPLACE FUNCTION public.sync_project_payment_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id text;
  v_has_overdue boolean;
BEGIN
  -- Determine project_id from the changed revenue row
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  IF v_project_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  -- Check if any revenue for this project is overdue (> 7 days past due_date, not received)
  SELECT EXISTS(
    SELECT 1 FROM revenues
    WHERE project_id = v_project_id
      AND status IN ('pending', 'overdue')
      AND due_date < (CURRENT_DATE - INTERVAL '7 days')
  ) INTO v_has_overdue;

  -- Update project blocked status
  UPDATE projects
  SET has_payment_block = v_has_overdue,
      updated_at = now()
  WHERE id::text = v_project_id
    AND (has_payment_block IS DISTINCT FROM v_has_overdue);

  -- Log event if block status changed
  IF v_has_overdue THEN
    INSERT INTO event_logs (action, entity_type, entity_id, details, workspace_id)
    SELECT 'payment_block_activated', 'project', v_project_id,
           jsonb_build_object('reason', 'revenue_overdue_7d'),
           workspace_id::text
    FROM projects WHERE id::text = v_project_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on revenues INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trg_sync_project_payment_block ON revenues;
CREATE TRIGGER trg_sync_project_payment_block
AFTER INSERT OR UPDATE OR DELETE ON revenues
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_payment_block();

-- =============================================
-- 2) Function: Calculate project health score (0-100)
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_project_health_score(p_project_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 100;
  v_project record;
  v_overdue_revenues integer;
  v_pending_revisions integer;
  v_days_overdue integer;
BEGIN
  -- Get project
  SELECT * INTO v_project FROM projects WHERE id::text = p_project_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Deduct for payment block
  IF v_project.has_payment_block = true THEN
    v_score := v_score - 25;
  END IF;

  -- Deduct for overdue revenues
  SELECT COUNT(*) INTO v_overdue_revenues
  FROM revenues
  WHERE project_id = p_project_id
    AND status IN ('pending', 'overdue')
    AND due_date < CURRENT_DATE;
  v_score := v_score - LEAST(v_overdue_revenues * 10, 30);

  -- Deduct for project overdue (past due_date)
  IF v_project.due_date IS NOT NULL AND v_project.due_date < CURRENT_DATE AND v_project.status != 'concluido' THEN
    v_days_overdue := (CURRENT_DATE - v_project.due_date);
    v_score := v_score - LEAST(v_days_overdue, 20);
  END IF;

  -- Deduct for pending change requests (revisions)
  SELECT COUNT(*) INTO v_pending_revisions
  FROM portal_change_requests pcr
  JOIN portal_links pl ON pl.id = pcr.portal_link_id
  WHERE pl.project_id::text = p_project_id
    AND pcr.status = 'pending';
  v_score := v_score - LEAST(v_pending_revisions * 5, 15);

  RETURN GREATEST(v_score, 0);
END;
$$;

-- =============================================
-- 3) Function: Auto-update health score on revenue changes
-- =============================================
CREATE OR REPLACE FUNCTION public.refresh_project_health_on_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id text;
  v_new_score integer;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  IF v_project_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  v_new_score := calculate_project_health_score(v_project_id);

  UPDATE projects
  SET health_score = v_new_score, updated_at = now()
  WHERE id::text = v_project_id
    AND (health_score IS DISTINCT FROM v_new_score);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_project_health_revenue ON revenues;
CREATE TRIGGER trg_refresh_project_health_revenue
AFTER INSERT OR UPDATE OR DELETE ON revenues
FOR EACH ROW
EXECUTE FUNCTION public.refresh_project_health_on_revenue();

-- =============================================
-- 4) Enable realtime for tasks table
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
