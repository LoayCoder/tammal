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

  const { data: endorsements = [], isPending } = useQuery({
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

  // Nominations that need my endorsement (submitted, not yet endorsed by me)
  const { data: myEndorsementRequests = [], isPending: requestsPending } = useQuery({
    queryKey: ['my-endorsement-requests', user?.id, tenantId],
    queryFn: async () => {
      if (!user?.id || !tenantId) return [];
      // Find submitted nominations where I haven't endorsed yet
      const { data: nominations, error: nomErr } = await supabase
        .from('nominations')
        .select('id, nominee_id, theme_id, headline, justification, cycle_id')
        .eq('endorsement_status', 'pending')
        .in('status', ['submitted', 'endorsed'])
        .is('deleted_at', null);
      if (nomErr) throw nomErr;
      if (!nominations?.length) return [];

      // Filter out nominations where I'm the nominee (can't endorse yourself)
      // and where I've already endorsed
      const { data: myEndorsements } = await supabase
        .from('peer_endorsements')
        .select('nomination_id')
        .eq('endorser_id', user.id)
        .is('deleted_at', null);
      const endorsedSet = new Set(myEndorsements?.map(e => e.nomination_id) || []);

      return nominations.filter(n => 
        n.nominee_id !== user.id && !endorsedSet.has(n.id)
      );
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
      // Count endorsements that are not explicitly invalid (null = pending review = counted)
      const { count } = await supabase
        .from('peer_endorsements')
        .select('id', { count: 'exact', head: true })
        .eq('nomination_id', input.nomination_id)
        .neq('is_valid', false)
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
    isPending,
    requestsPending,
    submitEndorsement,
    validCount: endorsements.filter(e => e.is_valid !== false).length,
  };
}
