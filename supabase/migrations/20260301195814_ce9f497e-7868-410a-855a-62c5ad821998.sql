
-- Add document_scope column to ai_knowledge_documents
ALTER TABLE public.ai_knowledge_documents
ADD COLUMN document_scope text NOT NULL DEFAULT 'private';

-- Validate document_scope values
CREATE OR REPLACE FUNCTION public.validate_document_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.document_scope NOT IN ('private', 'tenant') THEN
    RAISE EXCEPTION 'Invalid document_scope: %. Must be private or tenant', NEW.document_scope;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_document_scope
BEFORE INSERT OR UPDATE ON public.ai_knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION public.validate_document_scope();

-- Drop existing permissive policies to replace with stricter ones
DROP POLICY IF EXISTS "Users can manage their own knowledge documents" ON public.ai_knowledge_documents;
DROP POLICY IF EXISTS "Tenant admins can manage their knowledge documents" ON public.ai_knowledge_documents;
DROP POLICY IF EXISTS "Super admins can manage all knowledge documents" ON public.ai_knowledge_documents;

-- SELECT: owner sees own docs; tenant_admin sees all tenant docs; super_admin sees all
CREATE POLICY "Owner can view own documents"
ON public.ai_knowledge_documents FOR SELECT
USING (
  user_id = auth.uid()
  OR (document_scope = 'tenant' AND tenant_id = get_user_tenant_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- INSERT: user can only insert for themselves in their tenant
CREATE POLICY "Users can upload documents"
ON public.ai_knowledge_documents FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- UPDATE: owner or tenant_admin within same tenant
CREATE POLICY "Owner or admin can update documents"
ON public.ai_knowledge_documents FOR UPDATE
USING (
  (user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()))
  OR (tenant_id = get_user_tenant_id(auth.uid()) AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.custom_role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.base_role IN ('tenant_admin')
        AND r.deleted_at IS NULL
    )
  ))
);

-- DELETE: only owner or admin can delete (hard delete for storage cleanup)
CREATE POLICY "Owner or admin can delete documents"
ON public.ai_knowledge_documents FOR DELETE
USING (
  (user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()))
  OR (tenant_id = get_user_tenant_id(auth.uid()) AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.custom_role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.base_role IN ('tenant_admin')
        AND r.deleted_at IS NULL
    )
  ))
);

-- Tighten ai-knowledge storage bucket policies
-- Remove any existing overly permissive policies
DROP POLICY IF EXISTS "Users can upload to ai-knowledge" ON storage.objects;
DROP POLICY IF EXISTS "Users can view ai-knowledge" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete ai-knowledge" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ai-knowledge" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read ai-knowledge" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ai-knowledge" ON storage.objects;

-- Storage: upload only within own tenant folder
CREATE POLICY "Tenant users can upload ai-knowledge"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-knowledge'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
);

-- Storage: read only own tenant's files
CREATE POLICY "Tenant users can read ai-knowledge"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ai-knowledge'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
);

-- Storage: delete only own tenant's files
CREATE POLICY "Tenant users can delete ai-knowledge"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-knowledge'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
);
