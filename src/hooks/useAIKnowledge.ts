import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface KnowledgeDocument {
  id: string;
  tenant_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_text: string | null;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
}

export function useAIKnowledge() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['ai-knowledge-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_knowledge_documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeDocument[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const tenantResult = await supabase.rpc('get_user_tenant_id', { _user_id: user.user.id });
      const tenantId = tenantResult.data || user.user.id;

      // Upload to storage
      const filePath = `${tenantId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ai-knowledge')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create DB record
      const { data: doc, error: insertError } = await supabase
        .from('ai_knowledge_documents')
        .insert({
          tenant_id: tenantResult.data || tenantId,
          user_id: user.user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          is_active: true,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Trigger parsing
      const { error: parseError } = await supabase.functions.invoke('parse-document', {
        body: { documentId: doc.id, filePath, fileName: file.name },
      });
      if (parseError) {
        console.error('Parse error:', parseError);
        // Don't fail the upload, just warn
        toast.warning(t('aiGenerator.parseError'));
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-knowledge-documents'] });
      toast.success(t('aiGenerator.parseSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ai_knowledge_documents')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-knowledge-documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const doc = documents.find(d => d.id === id);
      // Hard delete from storage
      if (doc?.file_path) {
        await supabase.storage.from('ai-knowledge').remove([doc.file_path]);
      }
      // Hard delete from DB
      const { error } = await supabase
        .from('ai_knowledge_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-knowledge-documents'] });
    },
  });

  const deleteAllDocuments = async () => {
    for (const doc of documents) {
      if (doc.file_path) {
        await supabase.storage.from('ai-knowledge').remove([doc.file_path]);
      }
      await supabase.from('ai_knowledge_documents').delete().eq('id', doc.id);
    }
    queryClient.invalidateQueries({ queryKey: ['ai-knowledge-documents'] });
  };

  return {
    documents,
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    toggleDocument: toggleMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    deleteAllDocuments,
  };
}
