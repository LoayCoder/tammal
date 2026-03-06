-- Tighten workload_metrics RLS policies from {public} to {authenticated}
DROP POLICY IF EXISTS "wm_tenant_insert" ON public.workload_metrics;
DROP POLICY IF EXISTS "wm_tenant_select" ON public.workload_metrics;
DROP POLICY IF EXISTS "wm_tenant_update" ON public.workload_metrics;

CREATE POLICY "wm_tenant_insert" ON public.workload_metrics FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "wm_tenant_select" ON public.workload_metrics FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "wm_tenant_update" ON public.workload_metrics FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));