
-- Add template-specific columns for reusable templates
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]';
