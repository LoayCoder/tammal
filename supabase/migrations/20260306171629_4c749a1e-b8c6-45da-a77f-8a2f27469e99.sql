-- Fix legacy task_dependencies FKs: re-point from objective_actions to unified_tasks
ALTER TABLE public.task_dependencies
  DROP CONSTRAINT IF EXISTS task_dependencies_task_id_fkey,
  DROP CONSTRAINT IF EXISTS task_dependencies_depends_on_task_id_fkey;

ALTER TABLE public.task_dependencies
  ADD CONSTRAINT task_dependencies_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  ADD CONSTRAINT task_dependencies_depends_on_task_id_fkey
    FOREIGN KEY (depends_on_task_id) REFERENCES public.unified_tasks(id) ON DELETE CASCADE;

-- Add missing indexes on legacy task_dependencies
CREATE INDEX IF NOT EXISTS idx_task_deps_task_id
  ON public.task_dependencies (task_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on
  ON public.task_dependencies (depends_on_task_id) WHERE deleted_at IS NULL;