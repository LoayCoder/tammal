import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/features/auth/hooks/auth/useCurrentEmployee';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useRecurringTasks() {
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: templates, isPending } = useQuery({
    queryKey: ['task-templates', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  const upsertTemplate = useMutation({
    mutationFn: async ({ editId, payload }: { editId: string | null; payload: any }) => {
      if (editId) {
        const { error } = await supabase.from('task_templates').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_templates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, { editId }) => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success(editId ? t('common.save') : t('common.create'));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('task_templates').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-templates'] }),
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success(t('common.delete'));
    },
  });

  return { templates, isPending, employee, tenantId, upsertTemplate, toggleActive, softDelete };
}

