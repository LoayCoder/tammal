import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface FrameworkDocument {
  id: string;
  framework_id: string;
  tenant_id: string | null;
  file_name: string;
  extracted_text: string | null;
  created_at: string;
}

export function useFrameworkDocuments(frameworkId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: documents = [], isPending } = useQuery({
    queryKey: ['framework-documents', frameworkId],
    enabled: !!frameworkId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reference_documents')
        .select('*')
        .eq('framework_id', frameworkId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as FrameworkDocument[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (params: { frameworkId: string; file: File }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const tenantId = await supabase.rpc('get_user_tenant_id', { _user_id: user.user.id }).then(r => r.data);

      // Upload file to storage
      const filePath = `${tenantId}/frameworks/${params.frameworkId}/${Date.now()}_${params.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ai-knowledge')
        .upload(filePath, params.file);
      if (uploadError) throw uploadError;

      // Insert reference_documents record first to get the ID
      const { data: insertedDoc, error: insertError } = await supabase
        .from('reference_documents')
        .insert({
          framework_id: params.frameworkId,
          tenant_id: tenantId,
          file_name: params.file.name,
          extracted_text: null,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      // Parse document to extract text
      try {
        const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
          body: { documentId: insertedDoc.id, filePath, fileName: params.file.name },
        });
        if (parseError) {
          console.warn('Document parsing failed:', parseError);
        }
        if (parseData?.success && parseData?.contentLength > 0) {
          // Text was saved directly by the edge function
        }
      } catch (e) {
        console.warn('Document parsing failed, stored without extracted text:', e);
      }

      return { fileName: params.file.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['framework-documents'] });
      toast.success(t('aiGenerator.frameworkDocUploaded'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('aiGenerator.frameworkDocError'));
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from('reference_documents').delete().eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['framework-documents'] });
      toast.success(t('aiGenerator.frameworkDocDeleted'));
    },
    onError: () => toast.error(t('aiGenerator.frameworkDocError')),
  });

  return {
    documents,
    isPending,
    uploadDocument: uploadDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    isUploading: uploadDocument.isPending,
  };
}
