-- Create tenant_assets table
CREATE TABLE IF NOT EXISTS public.tenant_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    logo_light_url TEXT,
    logo_dark_url TEXT,
    pwa_icon_light_url TEXT,
    pwa_icon_dark_url TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_assets ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies
-- 1. SELECT Policy: Users can only see assets for their own tenant
CREATE POLICY "Users can view own tenant assets" ON public.tenant_assets
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 2. INSERT Policy: Users can only insert for their own tenant (enforced by profile)
CREATE POLICY "Users can insert own tenant assets" ON public.tenant_assets
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 3. UPDATE Policy: Users can only update their own tenant's assets
CREATE POLICY "Users can update own tenant assets" ON public.tenant_assets
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions (assuming authenticated role needs access)
GRANT ALL ON public.tenant_assets TO authenticated;
GRANT ALL ON public.tenant_assets TO service_role;

-- Storage Bucket Setup (Idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- We need to ensure the bucket 'tenant-assets' has policies
-- Drop existing policies if any to prevent conflicts/duplicates
DROP POLICY IF EXISTS "Tenant Isolation Select" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON storage.objects;

-- 1. Storage SELECT: Allow read if user is in the tenant corresponding to the folder
-- Path structure: tenants/{tenant_id}/assets/{filename}
CREATE POLICY "Tenant Isolation Select" ON storage.objects
FOR SELECT
USING (
    bucket_id = 'tenant-assets'
    AND (
        -- Allow public access for assets since they are used in public facing UI (logos)
        -- OR implement strict token-based access. 
        -- Given requirements "Users can read/write ONLY inside their tenant folder", 
        -- but frontend needs to load them. 
        -- A common pattern for logos is public read, or signed URL. 
        -- However, user asked for "No cross-tenant access". 
        -- If strictly private, we need signed URLs. 
        -- Let's stick to auth-checked access for now as per requirement.
        (storage.foldername(name))[2]::uuid IN (
             SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
);

-- 2. Storage INSERT: Allow upload only to own tenant folder
CREATE POLICY "Tenant Isolation Insert" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[2]::uuid IN (
         SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- 3. Storage UPDATE: Allow update only to own tenant folder
CREATE POLICY "Tenant Isolation Update" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'tenant-assets'
    AND (storage.foldername(name))[2]::uuid IN (
         SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
    )
);
