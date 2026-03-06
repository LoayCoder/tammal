
ALTER TABLE public.unified_tasks ADD COLUMN template_id UUID REFERENCES public.task_templates(id);
CREATE INDEX idx_unified_tasks_template ON public.unified_tasks(template_id) WHERE template_id IS NOT NULL AND deleted_at IS NULL;
