
-- Auto-create employee record when a profile's tenant_id is set
CREATE OR REPLACE FUNCTION public.auto_create_employee_on_profile_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when tenant_id is set (from NULL to a value)
  IF OLD.tenant_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
    -- Check if employee record already exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE user_id = NEW.user_id) THEN
      INSERT INTO employees (tenant_id, user_id, full_name, email, status)
      VALUES (
        NEW.tenant_id,
        NEW.user_id,
        COALESCE(NEW.full_name, 'New User'),
        get_user_email(NEW.user_id),
        'active'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_tenant_linked
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.tenant_id IS DISTINCT FROM NEW.tenant_id)
  EXECUTE FUNCTION auto_create_employee_on_profile_link();
