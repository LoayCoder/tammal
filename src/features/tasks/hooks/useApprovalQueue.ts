import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
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

      // Fetch evidence status for all tasks
      const taskIds = (data ?? []).map(t => t.id);
      let evidenceMap: Record<string, boolean> = {};
      if (taskIds.length > 0) {
        const { data: evData } = await supabase
          .from('task_evidence')
          .select('action_id, status')
          .in('action_id', taskIds)
          .is('deleted_at', null)
          .eq('status', 'approved');
        if (evData) {
          for (const e of evData) {
            evidenceMap[e.action_id] = true;
          }
        }
      }

      return (data ?? []).map(t => ({ ...t, _hasApprovedEvidence: !!evidenceMap[t.id] }));
    },
    enabled: !!tenantId && !!employee?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      // Update task status
      const { error } = await supabase.from('unified_tasks').update({ status }).eq('id', id);
      if (error) throw error;

      // If rejected with reason, log it to task_activity_logs via metadata
      if (status === 'rejected' && reason && employee?.id) {
        await supabase.from('task_activity_logs').insert({
          task_id: id,
          action: 'rejection_feedback',
          performed_by: employee.id,
          details: { reason, old_status: 'pending_approval', new_status: 'rejected' },
          tenant_id: tenantId!,
        });
      }
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
