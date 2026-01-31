-- New INSERT policy: Allow users to upload own avatar OR admins to upload for users in their tenant
CREATE POLICY "Avatar upload policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (
    -- User uploading their own avatar (file starts with their user_id)
    auth.uid()::text = split_part(name, '-', 1)
    -- Super admin can upload for anyone
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    -- Tenant admin can upload for users in their tenant
    OR (
      public.has_role(auth.uid(), 'tenant_admin'::app_role) 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id::text = split_part(name, '-', 1)
        AND tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- New UPDATE policy: Allow users to update own avatar OR admins
CREATE POLICY "Avatar update policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = split_part(name, '-', 1)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      public.has_role(auth.uid(), 'tenant_admin'::app_role) 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id::text = split_part(name, '-', 1)
        AND tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- New DELETE policy: Allow users to delete own avatar OR admins
CREATE POLICY "Avatar delete policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = split_part(name, '-', 1)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      public.has_role(auth.uid(), 'tenant_admin'::app_role) 
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id::text = split_part(name, '-', 1)
        AND tenant_id = public.get_user_tenant_id(auth.uid())
      )
    )
  )
);