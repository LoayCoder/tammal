-- First delete any rows with null tenant_id
DELETE FROM public.ai_knowledge_documents WHERE tenant_id IS NULL;
-- Restore NOT NULL constraint
ALTER TABLE public.ai_knowledge_documents ALTER COLUMN tenant_id SET NOT NULL;