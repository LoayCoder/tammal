

# Fix: "Failed to create tenant" - Missing default_language Column

## Problem Summary
When creating a tenant, the API returns error `PGRST204`:
```
Could not find the 'default_language' column of 'tenants' in the schema cache
```

## Root Cause
1. The migration file `20260201000001_add_default_language.sql` exists in the codebase
2. The `TenantSheet.tsx` form includes a `default_language` field that is submitted to the database
3. **However, the migration has not been applied** - the `default_language` column does not exist in the actual `tenants` table

## Solution Options

### Option A: Apply the Migration (Recommended)
Apply the existing migration to add the `default_language` column to the database:

```sql
-- Migration: 20260201000001_add_default_language.sql
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'ar'));

COMMENT ON COLUMN public.tenants.default_language IS 'Default language for the tenant (en or ar)';
```

This is the recommended approach since the feature is already built into the UI.

### Option B: Remove the Field from Code (Not Recommended)
Remove the `default_language` field from:
- `TenantSheet.tsx` - form schema, form fields, default values
- `handleSubmit` function data

This is **not recommended** as the feature aligns with the project's RTL/i18n requirements.

## Recommended Action
**Apply the migration** to add the `default_language` column. The code is ready and waiting for this database change.

## What Will Happen After Migration
Once the migration is applied:
- The `tenants` table will have a `default_language` column with default value `'en'`
- The column only accepts `'en'` or `'ar'` values (enforced by CHECK constraint)
- Tenant creation will work correctly with the language selector

## Technical Note
The migration uses `IF NOT EXISTS` so it's safe to run even if the column already exists. The CHECK constraint ensures data integrity for the bilingual (EN/AR) support requirement.

