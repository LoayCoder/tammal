
-- Create helper function to check if user is a representative
CREATE OR REPLACE FUNCTION public.is_representative(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.representative_assignments
    WHERE user_id = _user_id
      AND deleted_at IS NULL
  )
$$;

-- Add RLS policies for representatives on strategic_objectives
CREATE POLICY "Representatives can manage objectives"
ON public.strategic_objectives
FOR ALL
TO authenticated
USING (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- Add RLS policies for representatives on initiatives
CREATE POLICY "Representatives can manage initiatives"
ON public.initiatives
FOR ALL
TO authenticated
USING (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- Add RLS policies for representatives on objective_actions
CREATE POLICY "Representatives can manage actions"
ON public.objective_actions
FOR ALL
TO authenticated
USING (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (is_representative(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));
