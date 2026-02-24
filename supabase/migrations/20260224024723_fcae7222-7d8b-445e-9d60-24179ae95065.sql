
-- BUG-12: Add soft delete support to employee_responses
ALTER TABLE public.employee_responses 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update RLS policies to exclude soft-deleted rows for SELECT
DROP POLICY IF EXISTS "Employees can view their own responses" ON public.employee_responses;
CREATE POLICY "Employees can view their own responses"
ON public.employee_responses
FOR SELECT
USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND deleted_at IS NULL
);

-- Update existing SELECT policies for super admins / tenant admins to also filter deleted
-- (Super admin ALL policy already exists, but we should ensure deleted rows are filtered for normal users)
