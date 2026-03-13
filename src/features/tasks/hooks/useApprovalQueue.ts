import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/features/auth/hooks/auth/useCurrentEmployee';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useApprovalQueue() {
  const { tenantId } = useTenantId();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: pendingTasks = [], isPending: tasksLoading } = useQuery({
    queryKey: ['approval-queue', tenantId, employee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*, employee:employees!unified_tasks_employee_id_fkey(full_name)')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .or(`reviewer_id.eq.${employee!.id},approver_id.eq.${employee!.id}`)
        .in('status', ['under_review', 'pending_approval'])
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!employee?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('unified_tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-tasks'] });
      toast.success(t('tasks.updateSuccess'));
    },
    onError: () => toast.error(t('tasks.updateError')),
  });

  return { pendingTasks, tasksLoading, empLoading, employee, updateStatus };
}

