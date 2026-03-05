
-- ============================================================
-- MIGRATION 3: Action→Queue sync trigger + Production indexes
-- ============================================================

-- 3a) Sync trigger: objective_actions → task_queue_items
CREATE OR REPLACE FUNCTION public.sync_action_to_queue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_queue_items (tenant_id, action_id, employee_id, title, status, priority, due_date)
    VALUES (NEW.tenant_id, NEW.id, NEW.assignee_id, NEW.title, NEW.status, NEW.priority, NEW.planned_end);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Soft-delete sync
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE task_queue_items SET deleted_at = now(), updated_at = now()
      WHERE action_id = NEW.id AND deleted_at IS NULL;
      RETURN NEW;
    END IF;

    -- Sync assignee, status, priority, due_date, title changes
    UPDATE task_queue_items SET
      employee_id = NEW.assignee_id,
      title = NEW.title,
      status = NEW.status,
      priority = NEW.priority,
      due_date = NEW.planned_end,
      updated_at = now()
    WHERE action_id = NEW.id AND deleted_at IS NULL;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_action_to_queue
  AFTER INSERT OR UPDATE ON public.objective_actions
  FOR EACH ROW EXECUTE FUNCTION sync_action_to_queue();

-- 3b) Production-scale composite indexes
CREATE INDEX IF NOT EXISTS idx_actions_tenant_status
  ON public.objective_actions (tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_actions_tenant_assignee
  ON public.objective_actions (tenant_id, assignee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_actions_tenant_due
  ON public.objective_actions (tenant_id, planned_end)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_queue_tenant_employee
  ON public.task_queue_items (tenant_id, employee_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity
  ON public.audit_logs (tenant_id, entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalation_tenant_level
  ON public.escalation_events (tenant_id, escalation_level)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_task_evidence_tenant_action
  ON public.task_evidence (tenant_id, action_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_approvals_tenant_entity
  ON public.approvals (tenant_id, entity_type, entity_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subtasks_tenant_action
  ON public.action_sub_tasks (tenant_id, action_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_capacity_tenant
  ON public.employee_capacity (tenant_id, user_id)
  WHERE deleted_at IS NULL;
