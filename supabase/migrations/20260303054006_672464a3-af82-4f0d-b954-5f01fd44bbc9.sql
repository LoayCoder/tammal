
DROP FUNCTION IF EXISTS public.verify_invitation_code(text);

CREATE FUNCTION public.verify_invitation_code(p_code text)
RETURNS TABLE(id uuid, tenant_id uuid, used boolean, email text, full_name text, employee_id uuid, tenant_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.tenant_id, i.used, i.email, i.full_name, i.employee_id, t.name AS tenant_name
  FROM public.invitations i
  LEFT JOIN public.tenants t ON t.id = i.tenant_id
  WHERE UPPER(i.code) = UPPER(p_code)
    AND i.deleted_at IS NULL
    AND i.used = false
    AND (i.expires_at IS NULL OR i.expires_at > now())
  LIMIT 1;
$$;
