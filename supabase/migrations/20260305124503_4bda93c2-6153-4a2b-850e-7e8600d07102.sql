
-- ============================================================
-- MIGRATION 2: Audit log enhancements + Governance lock triggers
-- ============================================================

-- 2a) Add ip_address column to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address text;

-- 2b) Add INSERT policy on audit_logs for tenant users
CREATE POLICY "tenant_insert_audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    OR tenant_id IS NULL
  );

-- 2c) Governance lock trigger for objective_actions
CREATE OR REPLACE FUNCTION public.enforce_action_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_locked = true THEN
    -- Check if any frozen field changed
    IF (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.title_ar IS DISTINCT FROM NEW.title_ar OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR
      OLD.priority IS DISTINCT FROM NEW.priority OR
      OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours OR
      OLD.planned_start IS DISTINCT FROM NEW.planned_start OR
      OLD.planned_end IS DISTINCT FROM NEW.planned_end
    ) THEN
      -- Allow if unlocking (is_locked changing to false)
      IF NEW.is_locked = false THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Entity is locked. Frozen fields (title, assignee, priority, dates) cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_action_lock
  BEFORE UPDATE ON public.objective_actions
  FOR EACH ROW EXECUTE FUNCTION enforce_action_lock();

-- 2d) Governance lock trigger for initiatives
CREATE OR REPLACE FUNCTION public.enforce_initiative_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_locked = true THEN
    IF (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.title_ar IS DISTINCT FROM NEW.title_ar OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.description_ar IS DISTINCT FROM NEW.description_ar OR
      OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id OR
      OLD.accountable_user_id IS DISTINCT FROM NEW.accountable_user_id OR
      OLD.start_date IS DISTINCT FROM NEW.start_date OR
      OLD.end_date IS DISTINCT FROM NEW.end_date OR
      OLD.budget IS DISTINCT FROM NEW.budget
    ) THEN
      IF NEW.is_locked = false THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Initiative is locked. Frozen fields cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_initiative_lock
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW EXECUTE FUNCTION enforce_initiative_lock();

-- 2e) Governance lock trigger for strategic_objectives
CREATE OR REPLACE FUNCTION public.enforce_objective_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_locked = true THEN
    IF (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.title_ar IS DISTINCT FROM NEW.title_ar OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.description_ar IS DISTINCT FROM NEW.description_ar OR
      OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id OR
      OLD.accountable_user_id IS DISTINCT FROM NEW.accountable_user_id OR
      OLD.start_date IS DISTINCT FROM NEW.start_date OR
      OLD.end_date IS DISTINCT FROM NEW.end_date
    ) THEN
      IF NEW.is_locked = false THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Strategic objective is locked. Frozen fields cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_objective_lock
  BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW EXECUTE FUNCTION enforce_objective_lock();
