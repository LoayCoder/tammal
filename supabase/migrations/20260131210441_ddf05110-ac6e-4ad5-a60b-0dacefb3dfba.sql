-- Add RLS policy for super admins to update any profile
CREATE POLICY "Super admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add RLS policy for tenant admins to update profiles in their tenant
CREATE POLICY "Tenant admins can update profiles in their tenant"
ON public.profiles
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'tenant_admin'::app_role)
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'tenant_admin'::app_role)
);