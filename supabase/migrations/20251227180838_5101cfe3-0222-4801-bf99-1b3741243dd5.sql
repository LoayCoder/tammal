-- Create brand-assets storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true);

-- Allow public read access to brand assets
CREATE POLICY "Public read access for brand assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');

-- Tenant admins and super admins can upload/update their tenant's assets
CREATE POLICY "Tenant admins can upload brand assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND (
    (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Tenant admins and super admins can update their tenant's assets
CREATE POLICY "Tenant admins can update brand assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-assets' 
  AND (
    (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Tenant admins and super admins can delete their tenant's assets
CREATE POLICY "Tenant admins can delete brand assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-assets' 
  AND (
    (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);