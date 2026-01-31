-- Add organizational fields to profiles table for extended user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update the profiles_with_email view to include new columns
DROP VIEW IF EXISTS public.profiles_with_email;
CREATE VIEW public.profiles_with_email
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.user_id,
  p.tenant_id,
  p.full_name,
  p.avatar_url,
  p.status,
  p.job_title,
  p.department,
  p.phone,
  p.location,
  p.created_at,
  p.updated_at,
  public.get_user_email(p.user_id) as email
FROM public.profiles p;