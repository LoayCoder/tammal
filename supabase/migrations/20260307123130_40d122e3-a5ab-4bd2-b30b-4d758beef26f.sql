CREATE POLICY "Tenant members can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (
    (storage.foldername(name))[1] = (get_user_tenant_id(auth.uid()))::text
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);