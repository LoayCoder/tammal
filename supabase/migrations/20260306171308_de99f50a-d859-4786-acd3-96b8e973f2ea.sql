-- =============================================
-- Migration: Add missing performance indexes on unified_tasks
-- =============================================

-- Index for assignee lookups
CREATE INDEX IF NOT EXISTS idx_unified_tasks_assignee
  ON public.unified_tasks (assignee_id)
  WHERE deleted_at IS NULL;

-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_unified_tasks_department
  ON public.unified_tasks (department_id)
  WHERE deleted_at IS NULL;

-- Index for due date sorting/filtering
CREATE INDEX IF NOT EXISTS idx_unified_tasks_due_date
  ON public.unified_tasks (due_date)
  WHERE deleted_at IS NULL AND due_date IS NOT NULL;

-- Index for reviewer queue
CREATE INDEX IF NOT EXISTS idx_unified_tasks_reviewer
  ON public.unified_tasks (reviewer_id)
  WHERE deleted_at IS NULL AND reviewer_id IS NOT NULL;

-- Index for approver queue
CREATE INDEX IF NOT EXISTS idx_unified_tasks_approver
  ON public.unified_tasks (approver_id)
  WHERE deleted_at IS NULL AND approver_id IS NOT NULL;

-- Composite index for tenant + priority sorting (common query pattern)
CREATE INDEX IF NOT EXISTS idx_unified_tasks_tenant_priority
  ON public.unified_tasks (tenant_id, priority, due_date)
  WHERE deleted_at IS NULL;

-- Index on unified_task_dependencies for fast lookups
CREATE INDEX IF NOT EXISTS idx_utd_task_id
  ON public.unified_task_dependencies (task_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_utd_depends_on
  ON public.unified_task_dependencies (depends_on_task_id)
  WHERE deleted_at IS NULL;

-- =============================================
-- Add soft-delete column to task_activity_logs
-- =============================================
ALTER TABLE public.task_activity_logs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- =============================================
-- Harden RLS: switch child tables from public to authenticated
-- =============================================

-- task_comments
DROP POLICY IF EXISTS "Tenant isolation for task_comments" ON public.task_comments;
CREATE POLICY "Tenant isolation for task_comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_attachments
DROP POLICY IF EXISTS "Tenant isolation for task_attachments" ON public.task_attachments;
CREATE POLICY "Tenant isolation for task_attachments"
  ON public.task_attachments FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_checklists
DROP POLICY IF EXISTS "Tenant isolation for task_checklists" ON public.task_checklists;
CREATE POLICY "Tenant isolation for task_checklists"
  ON public.task_checklists FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_members
DROP POLICY IF EXISTS "Tenant isolation for task_members" ON public.task_members;
CREATE POLICY "Tenant isolation for task_members"
  ON public.task_members FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_activity_logs
DROP POLICY IF EXISTS "Tenant isolation for task_activity_logs" ON public.task_activity_logs;
CREATE POLICY "Tenant isolation for task_activity_logs"
  ON public.task_activity_logs FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_tags
DROP POLICY IF EXISTS "Tenant isolation for task_tags" ON public.task_tags;
CREATE POLICY "Tenant isolation for task_tags"
  ON public.task_tags FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- task_tag_links
DROP POLICY IF EXISTS "Tenant isolation for task_tag_links" ON public.task_tag_links;
CREATE POLICY "Tenant isolation for task_tag_links"
  ON public.task_tag_links FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- =============================================
-- Create approval_flows table for multi-step workflows
-- =============================================
CREATE TABLE IF NOT EXISTS public.approval_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  name_ar text,
  description text,
  entity_type text NOT NULL DEFAULT 'task',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.employees(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.approval_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for approval_flows"
  ON public.approval_flows FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_flows_tenant
  ON public.approval_flows (tenant_id)
  WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER set_approval_flows_updated_at
  BEFORE UPDATE ON public.approval_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();