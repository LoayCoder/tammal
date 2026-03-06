import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  tenant_id: string;
  created_at: string;
  deleted_at: string | null;
}

export function useTaskAttachments(taskId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TaskAttachment[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const upload = useMutation({
    mutationFn: async ({ task_id, file, uploaded_by }: { task_id: string; file: File; uploaded_by: string }) => {
      const filePath = `${tenantId}/${task_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.from('task_attachments').insert({
        task_id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by,
        tenant_id: tenantId!,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments'] });
      toast.success(t('tasks.attachments.uploadSuccess'));
    },
    onError: () => toast.error(t('tasks.attachments.uploadError')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_attachments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments'] });
    },
    onError: () => toast.error(t('tasks.attachments.deleteError')),
  });

  return {
    attachments: query.data ?? [],
    isPending: query.isPending,
    uploadFile: upload.mutate,
    removeFile: remove.mutate,
    isUploading: upload.isPending,
  };
}
