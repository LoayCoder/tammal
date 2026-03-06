
-- =============================================
-- Enterprise Task Management System - Phase 1
-- =============================================

-- 1. Add new columns to unified_tasks
ALTER TABLE public.unified_tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sites(id),
  ADD COLUMN IF NOT EXISTS initiative_id uuid REFERENCES public.initiatives(id),
  ADD COLUMN IF NOT EXISTS objective_id uuid REFERENCES public.strategic_objectives(id),
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS approver_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'department',
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_date timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_rule text;

-- 2. task_members
CREATE TABLE IF NOT EXISTS public.task_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.employees(id),
  role text NOT NULL DEFAULT 'assignee',
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (task_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_task_members_task ON public.task_members(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_members_user ON public.task_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_members_tenant ON public.task_members(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_members" ON public.task_members
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 3. task_checklists
CREATE TABLE IF NOT EXISTS public.task_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid REFERENCES public.employees(id),
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_task_checklists_task ON public.task_checklists(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_checklists_tenant ON public.task_checklists(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_checklists" ON public.task_checklists
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 4. task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.employees(id),
  comment_text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_comments_tenant ON public.task_comments(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_comments" ON public.task_comments
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 5. task_attachments
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid NOT NULL REFERENCES public.employees(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_attachments_tenant ON public.task_attachments(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_attachments" ON public.task_attachments
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 6. task_tags
CREATE TABLE IF NOT EXISTS public.task_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  color text NOT NULL DEFAULT '#6366f1',
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_task_tags_tenant ON public.task_tags(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_tags" ON public.task_tags
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 7. task_tag_links
CREATE TABLE IF NOT EXISTS public.task_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.task_tags(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (task_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_task_tag_links_task ON public.task_tag_links(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_tag_links_tenant ON public.task_tag_links(tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.task_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_tag_links" ON public.task_tag_links
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 8. task_activity_logs
CREATE TABLE IF NOT EXISTS public.task_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES public.employees(id),
  details jsonb DEFAULT '{}'::jsonb,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_logs_task ON public.task_activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_tenant ON public.task_activity_logs(tenant_id);

ALTER TABLE public.task_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_activity_logs" ON public.task_activity_logs
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 9. Storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can view task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 10. Validate task status trigger
CREATE OR REPLACE FUNCTION public.validate_unified_task_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('draft', 'open', 'in_progress', 'under_review', 'pending_approval', 'completed', 'rejected', 'archived') THEN
    RAISE EXCEPTION 'Invalid unified_tasks status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_unified_task_status_trigger
  BEFORE INSERT OR UPDATE ON public.unified_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_unified_task_status();

-- 11. Validate visibility
CREATE OR REPLACE FUNCTION public.validate_task_visibility()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.visibility NOT IN ('private', 'department', 'cross_department', 'organization') THEN
    RAISE EXCEPTION 'Invalid task visibility: %', NEW.visibility;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_task_visibility_trigger
  BEFORE INSERT OR UPDATE ON public.unified_tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_visibility();

-- 12. Validate task member role
CREATE OR REPLACE FUNCTION public.validate_task_member_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role NOT IN ('assignee', 'reviewer', 'approver', 'observer') THEN
    RAISE EXCEPTION 'Invalid task_members role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_task_member_role_trigger
  BEFORE INSERT OR UPDATE ON public.task_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_member_role();

-- 13. Auto-update task progress from checklists
CREATE OR REPLACE FUNCTION public.recalculate_task_progress_from_checklist()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_task_id uuid;
  v_total int;
  v_completed int;
  v_progress numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM task_checklists
  WHERE task_id = v_task_id AND deleted_at IS NULL;

  IF v_total = 0 THEN
    v_progress := 0;
  ELSE
    v_progress := ROUND((v_completed::numeric / v_total) * 100);
  END IF;

  UPDATE unified_tasks SET progress = v_progress, updated_at = now()
  WHERE id = v_task_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER recalculate_task_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.task_checklists
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_task_progress_from_checklist();

-- 14. updated_at triggers for new tables
CREATE TRIGGER update_task_checklists_updated_at
  BEFORE UPDATE ON public.task_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
