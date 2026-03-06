
-- Task notifications table
CREATE TABLE public.task_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  recipient_id UUID NOT NULL REFERENCES public.employees(id),
  task_id UUID NOT NULL REFERENCES public.unified_tasks(id),
  type TEXT NOT NULL, -- 'assigned', 'status_changed', 'comment_added', 'overdue', 'approval_requested', 'approved', 'rejected'
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_task_notifications_recipient ON public.task_notifications(recipient_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_notifications_tenant ON public.task_notifications(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_notifications_task ON public.task_notifications(task_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.task_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.task_notifications FOR SELECT TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can update their own notifications"
  ON public.task_notifications FOR UPDATE TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
  ON public.task_notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = current_tenant_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_notifications;

-- Trigger function: create notification on task assignment/status change
CREATE OR REPLACE FUNCTION public.notify_on_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- Notify reviewer when under_review
    IF NEW.status = 'under_review' AND NEW.reviewer_id IS NOT NULL THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.reviewer_id, NEW.id, 'approval_requested', 'Review requested: ' || NEW.title, 'A task is awaiting your review.');
    END IF;

    -- Notify approver when pending_approval
    IF NEW.status = 'pending_approval' AND NEW.approver_id IS NOT NULL THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.approver_id, NEW.id, 'approval_requested', 'Approval requested: ' || NEW.title, 'A task is awaiting your approval.');
    END IF;

    -- Notify assignee when approved/rejected
    IF NEW.status = 'completed' AND OLD.status IN ('under_review', 'pending_approval') THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.employee_id, NEW.id, 'approved', 'Task approved: ' || NEW.title, 'Your task has been approved.');
    END IF;

    IF NEW.status = 'rejected' THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (NEW.tenant_id, NEW.employee_id, NEW.id, 'rejected', 'Task rejected: ' || NEW.title, 'Your task has been rejected.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_task_change
  AFTER INSERT OR UPDATE ON public.unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_task_change();

-- Trigger function: notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_task_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
BEGIN
  SELECT id, employee_id, tenant_id, title INTO v_task
  FROM unified_tasks WHERE id = NEW.task_id;

  -- Only notify task owner if commenter is different
  IF v_task.employee_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
    VALUES (
      v_task.tenant_id,
      v_task.employee_id,
      v_task.id,
      'comment_added',
      'New comment on: ' || v_task.title,
      LEFT(NEW.comment_text, 100)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_task_comment
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_task_comment();
