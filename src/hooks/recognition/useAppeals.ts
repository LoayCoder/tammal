import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Appeal {
  id: string;
  tenant_id: string;
  theme_results_id: string;
  appellant_id: string;
  grounds: string;
  description: string;
  new_evidence_attachment_ids: string[] | null;
  committee_review: Record<string, any> | null;
  submitted_at: string;
  resolved_at: string | null;
  deleted_at: string | null;
}

type AppealGrounds = 'procedural_error' | 'new_evidence' | 'bias_allegation' | 'scoring_discrepancy';

interface SubmitAppealInput {
  theme_results_id: string;
  grounds: AppealGrounds;
  description: string;
}

export function useAppeals(cycleId?: string) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['appeals', tenantId, cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      // Get theme_results for this cycle first
      const { data: results } = await supabase
        .from('theme_results')
        .select('id')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (!results?.length) return [];
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .in('theme_results_id', results.map(r => r.id))
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Appeal[];
    },
    enabled: !!tenantId && !!cycleId,
  });

  const submitAppeal = useMutation({
    mutationFn: async (input: SubmitAppealInput) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');
      const { data, error } = await supabase
        .from('appeals')
        .insert({
          tenant_id: tenantId,
          theme_results_id: input.theme_results_id,
          appellant_id: user.id,
          grounds: input.grounds,
          description: input.description,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appeals'] });
      toast.success(t('recognition.appeals.submitSuccess'));
    },
    onError: () => toast.error(t('recognition.appeals.submitError')),
  });

  const resolveAppeal = useMutation({
    mutationFn: async ({ id, review }: { id: string; review: Record<string, any> }) => {
      const { error } = await supabase
        .from('appeals')
        .update({
          committee_review: review,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appeals'] });
      toast.success(t('recognition.appeals.resolveSuccess'));
    },
    onError: () => toast.error(t('recognition.appeals.resolveError')),
  });

  return { appeals, isLoading, submitAppeal, resolveAppeal };
}
