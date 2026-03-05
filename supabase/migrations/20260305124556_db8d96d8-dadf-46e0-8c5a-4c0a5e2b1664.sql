
-- ============================================================
-- MIGRATION 4: Strengthen RLS policies (missing DELETE + soft-delete)
-- ============================================================

-- Add DELETE policies for tables missing them
CREATE POLICY "ec_tenant_delete" ON public.employee_capacity
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "ee_tenant_delete" ON public.escalation_events
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "td_tenant_delete" ON public.task_dependencies
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wm_tenant_delete" ON public.workload_metrics
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add soft-delete filter to SELECT policies that lack it
-- Drop and recreate ec_tenant_select with soft-delete filter
DROP POLICY IF EXISTS "ec_tenant_select" ON public.employee_capacity;
CREATE POLICY "ec_tenant_select" ON public.employee_capacity
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- td_tenant_select already has no deleted_at column, so check schema
-- task_dependencies has deleted_at, add filter
DROP POLICY IF EXISTS "td_tenant_select" ON public.task_dependencies;
CREATE POLICY "td_tenant_select" ON public.task_dependencies
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- escalation_events select with soft-delete
DROP POLICY IF EXISTS "ee_tenant_select" ON public.escalation_events;
CREATE POLICY "ee_tenant_select" ON public.escalation_events
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- Manager-level policies on escalation_events
CREATE POLICY "managers_can_manage_escalations" ON public.escalation_events
  FOR ALL TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (is_manager(auth.uid()) OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
  );

-- Manager-level policies on task_evidence
CREATE POLICY "managers_can_verify_evidence" ON public.task_evidence
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (is_manager(auth.uid()) OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
  );
