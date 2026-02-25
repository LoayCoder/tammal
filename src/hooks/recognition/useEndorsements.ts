import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface PeerEndorsement {
  id: string;
  tenant_id: string;
  nomination_id: string;
  endorser_id: string;
  endorser_department_id: string | null;
  relationship: string;
  confirmation_statement: string;
  additional_context: string | null;
  is_valid: boolean | null;
  validation_reason: string | null;
  submitted_at: string;
}

export interface CreateEndorsementInput {
  nomination_id: string;
  relationship: 'direct_colleague' | 'cross_functional' | 'client' | 'reports_to';
  confirmation_statement: string;
  additional_context?: string;
}

export function useEndorsements(nominationId?: string) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: endorsements = [], isLoading } = useQuery({
    queryKey: ['endorsements', nominationId],
    queryFn: async () => {
      if (!nominationId) return [];
      const { data, error } = await supabase
        .from('peer_endorsements')
        .select('*')
        .eq('nomination_id', nominationId)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PeerEndorsement[];
    },
    enabled: !!nominationId && !!tenantId,
  });

  // Endorsements where I am the endorser (pending requests)
  const { data: myEndorsementRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['my-endorsement-requests', user?.id, tenantId],
    queryFn: async () => {
      // Get nominations where I'm the nominee and endorsement_status is pending
      // In a real system we'd have an endorsement_requests table, but for now
      // we show nominations that are "submitted" and need endorsements
      return [];
    },
    enabled: !!user?.id && !!tenantId,
  });

  const submitEndorsement = useMutation({
    mutationFn: async (input: CreateEndorsementInput) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');

      const { data, error } = await supabase
        .from('peer_endorsements')
        .insert({
          ...input,
          tenant_id: tenantId,
          endorser_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Check if nomination now has sufficient endorsements
      const { count } = await supabase
        .from('peer_endorsements')
        .select('id', { count: 'exact', head: true })
        .eq('nomination_id', input.nomination_id)
        .eq('is_valid', true)
        .is('deleted_at', null);

      if ((count ?? 0) >= 2) {
        await supabase
          .from('nominations')
          .update({ endorsement_status: 'sufficient', status: 'endorsed' })
          .eq('id', input.nomination_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endorsements'] });
      qc.invalidateQueries({ queryKey: ['nominations'] });
      qc.invalidateQueries({ queryKey: ['my-nominations'] });
      qc.invalidateQueries({ queryKey: ['received-nominations'] });
      toast.success(t('recognition.endorsements.submitSuccess'));
    },
    onError: () => toast.error(t('recognition.endorsements.submitError')),
  });

  return {
    endorsements,
    myEndorsementRequests,
    isLoading,
    requestsLoading,
    submitEndorsement,
    validCount: endorsements.filter(e => e.is_valid !== false).length,
  };
}
