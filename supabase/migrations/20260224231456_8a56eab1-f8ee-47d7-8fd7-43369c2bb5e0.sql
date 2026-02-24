
-- ============================================================
-- Phase A: Locking, Comments, Created-by columns + Manager RLS + Auto-Progress Trigger
-- ============================================================

-- 1. Add locking columns to strategic_objectives
ALTER TABLE public.strategic_objectives
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by uuid,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- 2. Add locking columns to initiatives
ALTER TABLE public.initiatives
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by uuid,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- 3. Add locking, comments, created_by to objective_actions
ALTER TABLE public.objective_actions
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by uuid,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 4. Add locking, comments, created_by to unified_tasks
ALTER TABLE public.unified_tasks
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by uuid,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- ============================================================
-- 5. Insert workload permission codes
-- ============================================================
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, category)
VALUES
  ('workload.manage', 'Manage Workload', 'إدارة أعباء العمل', 'Create, assign, and lock tasks and OKRs', 'إنشاء وتعيين وقفل المهام والأهداف', 'workload'),
  ('workload.view', 'View Workload', 'عرض أعباء العمل', 'View workload data', 'عرض بيانات أعباء العمل', 'workload'),
  ('objectives.manage', 'Manage Objectives', 'إدارة الأهداف', 'Create and edit objectives, initiatives, actions', 'إنشاء وتحرير الأهداف والمبادرات والإجراءات', 'workload'),
  ('objectives.view', 'View Objectives', 'عرض الأهداف', 'View objectives and progress', 'عرض الأهداف والتقدم', 'workload')
ON CONFLICT (code) DO NOTHING;

-- Grant new permissions to existing Manager role templates
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.base_role = 'manager'
  AND r.deleted_at IS NULL
  AND p.code IN ('workload.manage', 'workload.view', 'objectives.manage', 'objectives.view')
ON CONFLICT DO NOTHING;

-- Also grant to Administrator (tenant_admin) role templates
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.base_role = 'tenant_admin'
  AND r.deleted_at IS NULL
  AND p.code IN ('workload.manage', 'workload.view', 'objectives.manage', 'objectives.view')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. Manager RLS policies
-- ============================================================

CREATE POLICY "Managers can manage objectives"
  ON public.strategic_objectives
  FOR ALL
  TO authenticated
  USING (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Managers can manage initiatives"
  ON public.initiatives
  FOR ALL
  TO authenticated
  USING (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Managers can manage actions"
  ON public.objective_actions
  FOR ALL
  TO authenticated
  USING (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Managers can manage department tasks"
  ON public.unified_tasks
  FOR ALL
  TO authenticated
  USING (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND employee_id IN (
      SELECT id FROM employees
      WHERE department_id = get_user_department_id(auth.uid())
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    is_manager(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND employee_id IN (
      SELECT id FROM employees
      WHERE department_id = get_user_department_id(auth.uid())
        AND deleted_at IS NULL
    )
  );

-- ============================================================
-- 7. Auto-progress trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalculate_initiative_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initiative_id uuid;
  v_total int;
  v_completed int;
  v_new_progress numeric;
  v_new_status text;
  v_objective_id uuid;
  v_obj_avg numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_initiative_id := OLD.initiative_id;
  ELSE
    v_initiative_id := NEW.initiative_id;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM objective_actions
  WHERE initiative_id = v_initiative_id
    AND deleted_at IS NULL;

  IF v_total = 0 THEN
    v_new_progress := 0;
  ELSE
    v_new_progress := ROUND((v_completed::numeric / v_total) * 100, 1);
  END IF;

  IF v_new_progress = 0 THEN v_new_status := 'planned';
  ELSIF v_new_progress >= 100 THEN v_new_status := 'completed';
  ELSE v_new_status := 'in_progress';
  END IF;

  UPDATE initiatives
  SET progress = v_new_progress, status = v_new_status, updated_at = now()
  WHERE id = v_initiative_id;

  SELECT objective_id INTO v_objective_id
  FROM initiatives
  WHERE id = v_initiative_id;

  IF v_objective_id IS NOT NULL THEN
    SELECT COALESCE(AVG(progress), 0)
    INTO v_obj_avg
    FROM initiatives
    WHERE objective_id = v_objective_id
      AND deleted_at IS NULL;

    UPDATE strategic_objectives
    SET progress = ROUND(v_obj_avg, 1), updated_at = now()
    WHERE id = v_objective_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_recalculate_progress
  AFTER INSERT OR UPDATE OF status, deleted_at OR DELETE
  ON public.objective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_initiative_progress();
