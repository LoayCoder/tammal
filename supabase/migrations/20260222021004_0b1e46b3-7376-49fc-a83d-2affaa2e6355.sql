
-- Create thought_reframes table
CREATE TABLE public.thought_reframes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  negative_thought text NOT NULL,
  challenge_answers jsonb DEFAULT '{}'::jsonb,
  reframed_thought text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.thought_reframes ENABLE ROW LEVEL SECURITY;

-- Employees can SELECT their own (non-deleted)
CREATE POLICY "Employees can view their own reframes"
ON public.thought_reframes FOR SELECT
USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND deleted_at IS NULL
);

-- Employees can INSERT their own
CREATE POLICY "Employees can insert their own reframes"
ON public.thought_reframes FOR INSERT
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Employees can UPDATE their own (for soft delete)
CREATE POLICY "Employees can update their own reframes"
ON public.thought_reframes FOR UPDATE
USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Super admins can manage all
CREATE POLICY "Super admins can manage all reframes"
ON public.thought_reframes FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can view tenant reframes
CREATE POLICY "Tenant admins can view tenant reframes"
ON public.thought_reframes FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_thought_reframes_employee ON public.thought_reframes(employee_id, created_at DESC);
CREATE INDEX idx_thought_reframes_tenant ON public.thought_reframes(tenant_id);
