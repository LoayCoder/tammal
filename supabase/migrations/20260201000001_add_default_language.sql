-- Migration to add default_language column to tenants table

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'ar'));

COMMENT ON COLUMN public.tenants.default_language IS 'Default language for the tenant (en or ar)';
