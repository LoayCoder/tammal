import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
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
        .eq('tenant_id', tenantId)
        .in('nominee_id', reportUserIds)
        .eq('manager_approval_status', 'pending')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Nomination[];
    },
    enabled: !!user?.id && !!tenantId && !!tenantId,
  });

  const approveNomination = useMutation({
    mutationFn: async ({ id, criteriaAdjustments, additionalEndorserIds }: { id: string; criteriaAdjustments?: Record<string, { weight: number; justification: string }>; additionalEndorserIds?: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const updateData: Record<string, any> = {
        manager_approval_status: 'approved',
        manager_approved_by: user.id,
        manager_approval_at: new Date().toISOString(),
        status: 'endorsed',
        endorsement_status: 'sufficient',
      };
      if (criteriaAdjustments) {
        updateData.manager_criteria_adjustments = criteriaAdjustments;
      }
      const { error } = await supabase
        .from('nominations')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;

      // Get tenant_id and nomination details for notifications
      const { data: currentEmp } = await supabase
        .from('employees')
        .select('tenant_id, full_name')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      const { data: nom } = await supabase
        .from('nominations')
        .select('headline, nominator_id, nominee_id')
        .eq('id', id)
        .single();

      let nominatorName = '';
      if (nom?.nominator_id) {
        const { data: emp } = await supabase
          .from('employees')
          .select('full_name')
          .eq('user_id', nom.nominator_id)
          .is('deleted_at', null)
          .maybeSingle();
        nominatorName = emp?.full_name || '';
      }

      // Notify the nominee that their nomination was approved
      if (nom?.nominee_id && currentEmp?.tenant_id) {
        await supabase.from('recognition_notifications').insert({
          tenant_id: currentEmp.tenant_id,
          user_id: nom.nominee_id,
          nomination_id: id,
          type: 'nomination_approved',
          title: t('recognition.nominations.notifyNomineeApproved'),
          body: t('recognition.nominations.notifyNomineeApprovedBody', { headline: nom.headline || '' }),
        } as any);
      }

      // Insert additional endorsement requests from manager
      if (additionalEndorserIds?.length && currentEmp?.tenant_id) {
        const endorserRows = additionalEndorserIds.map(uid => ({
          tenant_id: currentEmp.tenant_id,
          nomination_id: id,
          requested_user_id: uid,
          requested_by: user.id,
        }));
        await supabase.from('endorsement_requests').insert(endorserRows as any);

        // Send notifications immediately (nomination is already approved)
        const endorserNotifs = additionalEndorserIds.map(uid => ({
          tenant_id: currentEmp.tenant_id,
          user_id: uid,
          nomination_id: id,
          type: 'endorsement_requested',
          title: currentEmp.full_name ? `${currentEmp.full_name} requested your endorsement` : 'Endorsement requested',
          body: nom?.headline ? `Please review and endorse the nomination for "${nom.headline}"` : '',
        }));
        await supabase.from('recognition_notifications').insert(endorserNotifs as any);
      }

      // Send endorsement notifications for any existing pending requests
      const { data: pendingRequests } = await supabase
        .from('endorsement_requests')
        .select('requested_user_id, nomination_id')
        .eq('nomination_id', id)
        .eq('status', 'pending')
        .is('deleted_at', null);

      if (pendingRequests?.length && currentEmp?.tenant_id) {
        // Exclude the additional endorsers we just notified
        const alreadyNotified = new Set(additionalEndorserIds || []);
        const toNotify = pendingRequests.filter(r => !alreadyNotified.has(r.requested_user_id));

        if (toNotify.length) {
          const notifRows = toNotify.map(r => ({
            tenant_id: currentEmp.tenant_id,
            user_id: r.requested_user_id,
            nomination_id: id,
            type: 'endorsement_requested',
            title: nominatorName ? `${nominatorName} requested your endorsement` : 'Endorsement requested',
            body: nom?.headline ? `Please review and endorse the nomination for "${nom.headline}"` : '',
          }));
          await supabase.from('recognition_notifications').insert(notifRows as any);
        }
      }
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

      // Notify the nominee that their nomination was rejected
      const { data: nom } = await supabase
        .from('nominations')
        .select('headline, nominee_id')
        .eq('id', id)
        .single();

      const { data: currentEmp } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (nom?.nominee_id && currentEmp?.tenant_id) {
        await supabase.from('recognition_notifications').insert({
          tenant_id: currentEmp.tenant_id,
          user_id: nom.nominee_id,
          nomination_id: id,
          type: 'nomination_rejected',
          title: t('recognition.nominations.notifyNomineeRejected'),
          body: t('recognition.nominations.notifyNomineeRejectedBody', { headline: nom.headline || '' }),
        } as any);
      }
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

