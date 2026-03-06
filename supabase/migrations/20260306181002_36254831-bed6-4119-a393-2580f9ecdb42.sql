-- Fix #4: Extend notifications to also notify task_members with reviewer/approver roles
CREATE OR REPLACE FUNCTION public.notify_on_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_member RECORD;
BEGIN
  -- New task assigned
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
    VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      'assigned',
      'New task assigned: ' || NEW.title,
      'You have been assigned a new task.'
    );
    RETURN NEW;
  END IF;

  -- Status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify task owner
    INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body, metadata)
    VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      'status_changed',
      'Task status updated: ' || NEW.title,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );

    -- Notify reviewer(s) when under_review
    IF NEW.status = 'under_review' THEN
      -- Direct reviewer
      IF NEW.reviewer_id IS NOT NULL THEN
        INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
        VALUES (NEW.tenant_id, NEW.reviewer_id, NEW.id, 'approval_requested', 'Review requested: ' || NEW.title, 'A task is awaiting your review.');
      END IF;
      -- Additional task_members with reviewer role
      FOR v_member IN
        SELECT user_id FROM task_members
        WHERE task_id = NEW.id AND role = 'reviewer' AND deleted_at IS NULL
          AND user_id IS DISTINCT FROM NEW.reviewer_id
      LOOP
        INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
        VALUES (NEW.tenant_id, v_member.user_id, NEW.id, 'approval_requested', 'Review requested: ' || NEW.title, 'A task is awaiting your review.');
      END LOOP;
    END IF;

    -- Notify approver(s) when pending_approval
    IF NEW.status = 'pending_approval' THEN
      -- Direct approver
      IF NEW.approver_id IS NOT NULL THEN
        INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
        VALUES (NEW.tenant_id, NEW.approver_id, NEW.id, 'approval_requested', 'Approval requested: ' || NEW.title, 'A task is awaiting your approval.');
      END IF;
      -- Additional task_members with approver role
      FOR v_member IN
        SELECT user_id FROM task_members
        WHERE task_id = NEW.id AND role = 'approver' AND deleted_at IS NULL
          AND user_id IS DISTINCT FROM NEW.approver_id
      LOOP
        INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
        VALUES (NEW.tenant_id, v_member.user_id, NEW.id, 'approval_requested', 'Approval requested: ' || NEW.title, 'A task is awaiting your approval.');
      END LOOP;
    END IF;

    -- Notify assignee when approved
    IF NEW.status = 'completed' AND OLD.status IN ('under_review', 'pending_approval') THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.employee_id, NEW.id, 'approved', 'Task approved: ' || NEW.title, 'Your task has been approved.');
    END IF;

    -- Notify assignee when rejected
    IF NEW.status = 'rejected' THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.employee_id, NEW.id, 'rejected', 'Task rejected: ' || NEW.title, 'Your task has been rejected.');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;