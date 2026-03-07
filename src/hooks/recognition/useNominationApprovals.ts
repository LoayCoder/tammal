import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Nomination } from './useNominations';

/**
 * Hook for managers to view and act on nominations pending their approval.
 * A nomination requires manager approval when the cycle has allowAppeals enabled.
 * The manager is the nominee's direct manager (employees.manager_id).
 */
export function useNominationApprovals() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  // Fetch nominations where current user is the nominee's manager and approval is pending
  const { data: pendingApprovals = [], isPending } = useQuery({
    queryKey: ['nomination-approvals', user?.id, tenantId],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Get current user's employee record
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!currentEmployee) return [];

      // 2. Get user_ids of direct reports (employees where manager_id = current employee)
      const { data: directReports } = await supabase
        .from('employees')
        .select('user_id')
        .eq('manager_id', currentEmployee.id)
        .is('deleted_at', null);

      if (!directReports?.length) return [];

      const reportUserIds = directReports
        .map(e => e.user_id)
        .filter((id): id is string => !!id);

      if (!reportUserIds.length) return [];

      // 3. Fetch nominations where nominee_id is one of the direct reports and approval is pending
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .in('nominee_id', reportUserIds)
        .eq('manager_approval_status', 'pending')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Nomination[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  const approveNomination = useMutation({
    mutationFn: async ({ id, criteriaAdjustments }: { id: string; criteriaAdjustments?: Record<string, { weight: number; justification: string }> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const updateData: Record<string, any> = {
        manager_approval_status: 'approved',
        manager_approved_by: user.id,
        manager_approval_at: new Date().toISOString(),
        status: 'endorsed',
      };
      if (criteriaAdjustments) {
        updateData.manager_criteria_adjustments = criteriaAdjustments;
      }
      const { error } = await supabase
        .from('nominations')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomination-approvals'] });
      qc.invalidateQueries({ queryKey: ['nominations'] });
      qc.invalidateQueries({ queryKey: ['my-nominations'] });
      toast.success(t('recognition.nominations.managerApproved'));
    },
    onError: () => toast.error(t('recognition.nominations.submitError')),
  });

  const rejectNomination = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('nominations')
        .update({
          manager_approval_status: 'rejected',
          manager_approved_by: user.id,
          manager_approval_at: new Date().toISOString(),
          manager_rejection_reason: reason,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomination-approvals'] });
      qc.invalidateQueries({ queryKey: ['nominations'] });
      qc.invalidateQueries({ queryKey: ['my-nominations'] });
      toast.success(t('recognition.nominations.managerRejected'));
    },
    onError: () => toast.error(t('recognition.nominations.submitError')),
  });

  return { pendingApprovals, isPending, approveNomination, rejectNomination };
}
