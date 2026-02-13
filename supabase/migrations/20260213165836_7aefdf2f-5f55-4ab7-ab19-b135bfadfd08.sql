
-- Create ai_knowledge_documents table
CREATE TABLE public.ai_knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  content_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admins can manage all knowledge documents"
  ON public.ai_knowledge_documents FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their knowledge documents"
  ON public.ai_knowledge_documents FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create private storage bucket for ai-knowledge
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-knowledge', 'ai-knowledge', false);

-- Storage policies for ai-knowledge bucket
CREATE POLICY "Tenant users can upload to ai-knowledge"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Tenant users can read from ai-knowledge"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-knowledge' AND auth.uid() IS NOT NULL);

CREATE POLICY "Tenant users can delete from ai-knowledge"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ai-knowledge' AND auth.uid() IS NOT NULL);
