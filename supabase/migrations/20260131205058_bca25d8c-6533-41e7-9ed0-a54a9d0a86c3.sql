-- Add status column for user account states
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint using a trigger instead of CHECK (for flexibility)
CREATE OR REPLACE FUNCTION public.validate_profile_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status value. Must be one of: active, inactive, suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_profile_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_status();

-- Create a database function to fetch user emails securely
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- Create a view that includes email for easier querying
CREATE VIEW public.profiles_with_email AS
SELECT 
  p.*,
  public.get_user_email(p.user_id) as email
FROM public.profiles p;