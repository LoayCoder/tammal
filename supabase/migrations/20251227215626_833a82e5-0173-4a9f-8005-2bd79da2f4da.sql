-- 1. Add slug column
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Add plan_id with foreign key to plans table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);

-- 3. Add settings JSONB column with defaults
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "allow_signup": true,
  "mfa_required": false,
  "max_users": 10,
  "modules": {
    "user_management": true,
    "billing": true,
    "support": true,
    "org_structure": true,
    "documents": true
  }
}'::jsonb;

-- 4. Create function to auto-generate slug from name
CREATE OR REPLACE FUNCTION public.generate_tenant_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure uniqueness by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for auto-slug generation
DROP TRIGGER IF EXISTS set_tenant_slug ON public.tenants;
CREATE TRIGGER set_tenant_slug
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tenant_slug();

-- 6. Backfill existing tenants with slugs
UPDATE public.tenants 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;