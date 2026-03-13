import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface SendEndorsementInput {
  tenantId: string;
  nominationId: string;
  requestedUserIds: string[];
  requestedBy: string;
  currentUserName: string;
  managerApprovalPending?: boolean;
}

export function useEndorsementRequests() {
  const { t } = useTranslation();

  const sendRequests = useMutation({
    mutationFn: async ({
      tenantId,
      nominationId,
      requestedUserIds,
      requestedBy,
      currentUserName,
      managerApprovalPending,
    }: SendEndorsementInput) => {
      // Insert endorsement requests
      const rows = requestedUserIds.map(uid => ({
        tenant_id: tenantId,
        nomination_id: nominationId,
        requested_user_id: uid,
        requested_by: requestedBy,
      }));
      const { error } = await supabase.from('endorsement_requests').insert(rows as any);
      if (error) throw error;

      // Send notifications unless manager approval is pending
      if (!managerApprovalPending) {
        const { data: nomData } = await supabase
          .from('nominations')
          .select('headline')
          .eq('id', nominationId)
          .single();
        const headline = nomData?.headline || '';

        const notificationRows = requestedUserIds.map(uid => ({
          tenant_id: tenantId,
          user_id: uid,
          nomination_id: nominationId,
          type: 'endorsement_requested',
          title: t('notifications.endorsementRequested', { name: currentUserName }),
          body: t('notifications.endorsementRequestedBody', { headline: headline || '—' }),
        }));
        await supabase.from('recognition_notifications').insert(notificationRows as any);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.managerApprovalPending
          ? t('recognition.endorsements.endorsementsPendingApproval')
          : t('recognition.endorsements.requestsSent')
      );
    },
    onError: () => {
      toast.error(t('recognition.endorsements.requestError'));
    },
  });

  return { sendRequests };
}
