import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface SecureAttachment {
  id: string;
  tenant_id: string;
  context: string;
  context_id: string | null;
  uploader_user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  expires_at: string;
  watermark_text: string | null;
  access_log: any;
  created_at: string;
  deleted_at: string | null;
}

export function useSecureAttachments(caseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: attachments = [], isPending } = useQuery({
    queryKey: ['mh-secure-attachments', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_secure_attachments')
        .select('*')
        .eq('context', 'crisis_case')
        .eq('context_id', caseId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SecureAttachment[];
    },
    enabled: !!caseId && !!user?.id,
  });

  const uploadAttachment = useMutation({
    mutationFn: async ({
      file, caseId: cId, tenantId, expiryDays = 30,
    }: {
      file: File;
      caseId: string;
      tenantId: string;
      expiryDays?: number;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', cId);
      formData.append('tenant_id', tenantId);
      formData.append('expiry_days', String(expiryDays));

      const { data, error } = await supabase.functions.invoke('secure-upload?action=upload', {
        body: formData,
      });

      if (error) throw error;
      return data.attachment as SecureAttachment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-secure-attachments', caseId] });
    },
  });

  const viewAttachment = async (attachmentId: string) => {
    const { data, error } = await supabase.functions.invoke('secure-upload?action=view', {
      body: { attachment_id: attachmentId },
    });
    if (error) throw error;
    return data as {
      url: string;
      watermark: string;
      expires_at: string;
      file_type: string;
      file_name: string;
    };
  };

  const revokeAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase.functions.invoke('secure-upload?action=revoke', {
        body: { attachment_id: attachmentId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-secure-attachments', caseId] });
    },
  });

  return {
    attachments,
    isPending,
    uploadAttachment,
    viewAttachment,
    revokeAttachment,
  };
}
