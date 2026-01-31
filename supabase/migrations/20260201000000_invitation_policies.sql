-- RLS Policy for Invitations to allow Super Admins to create invitations for any tenant
-- This is necessary because when creating a tenant, we want to immediately invite the admin.

DROP POLICY IF EXISTS "Super admins can manage all invitations" ON public.invitations;

CREATE POLICY "Super admins can manage all invitations" ON public.invitations
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin')
  );

-- Also ensure that we can insert invitations if we are creating a tenant (though usually this is done by super admin)
-- If the user is just a 'user' creating a trial tenant (self-serve), they might not be super_admin yet.
-- Ideally, self-serve tenant creation should happen via a secure Edge Function (rpc) or the user becomes tenant_admin immediately.
-- For now, we assume the creator is a Super Admin or the flow is protected.
