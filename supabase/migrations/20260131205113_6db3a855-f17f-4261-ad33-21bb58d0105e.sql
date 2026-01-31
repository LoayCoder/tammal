-- Fix security issue: Make view use SECURITY INVOKER and fix function search paths

-- Drop the existing view
DROP VIEW IF EXISTS public.profiles_with_email;

-- Fix the validate_profile_status function search path
CREATE OR REPLACE FUNCTION public.validate_profile_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status value. Must be one of: active, inactive, suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate the view with proper SECURITY INVOKER (explicit)
-- Note: The get_user_email function already has SECURITY DEFINER with search_path set
CREATE VIEW public.profiles_with_email
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  public.get_user_email(p.user_id) as email
FROM public.profiles p;