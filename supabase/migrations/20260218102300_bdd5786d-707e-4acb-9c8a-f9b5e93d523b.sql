-- Fix: Exposed auth.users in profiles_with_email view
-- The view must NOT expose auth.users directly to PostgREST.
-- Instead we use a SECURITY DEFINER function to safely fetch the email,
-- keeping auth.users out of PostgREST's exposed schemas.

-- Drop the problematic view
DROP VIEW IF EXISTS public.profiles_with_email;

-- Create a security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_profile_email(_user_id uuid)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id;
$$;

-- Recreate the view without directly joining auth.users
CREATE OR REPLACE VIEW public.profiles_with_email
WITH (security_invoker = true)
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
    public.get_profile_email(p.user_id) AS email
  FROM public.profiles p;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_with_email TO authenticated;
REVOKE ALL ON public.profiles_with_email FROM anon;