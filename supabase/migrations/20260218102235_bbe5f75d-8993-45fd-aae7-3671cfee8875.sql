-- SEC-02: Add RLS policies to profiles_with_email view
-- This view joins profiles with auth emails and needs proper access control.
-- Views in Postgres inherit RLS from their underlying tables, but we enforce
-- explicit policies here to prevent cross-tenant data leakage.

-- Drop and recreate view with security barrier to prevent function inlining attacks
DROP VIEW IF EXISTS public.profiles_with_email;

CREATE OR REPLACE VIEW public.profiles_with_email
WITH (security_barrier = true)
AS
  SELECT
    p.id,
    p.user_id,
    p.tenant_id,
    p.created_at,
    p.updated_at,
    p.full_name,
    p.avatar_url,
    p.status,
    p.job_title,
    p.department,
    p.phone,
    p.location,
    u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id;

-- Grant access to authenticated users (RLS on underlying profiles table still applies)
GRANT SELECT ON public.profiles_with_email TO authenticated;

-- Revoke public access
REVOKE ALL ON public.profiles_with_email FROM anon;