import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Nomination {
  id: string;
  tenant_id: string;
  cycle_id: string;
  theme_id: string;
  nominee_id: string;
  nominee_department_id: string | null;
  nominee_tenure_months: number | null;
  nominator_id: string;
  nominator_role: string;
  nominator_department_id: string | null;
  headline: string;
  justification: string;
  specific_examples: string[] | null;
  impact_metrics: string[] | null;
  cross_department_evidence: Record<string, any> | null;
  manager_assessment: Record<string, any> | null;
  ai_analysis: Record<string, any> | null;
  endorsement_status: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateNominationInput {
  cycle_id: string;
  theme_id: string;
  nominee_id: string;
  nominee_department_id?: string;
  nominator_role: 'manager' | 'peer' | 'self';
  headline: string;
  justification: string;
  specific_examples?: string[];
  impact_metrics?: string[];
  cross_department_evidence?: Record<string, any>;
}

export function useNominations(cycleId?: string, themeId?: string) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: nominations = [], isPending } = useQuery({
    queryKey: ['nominations', tenantId, cycleId, themeId],
    queryFn: async () => {
      let query = supabase
        .from('nominations')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (cycleId) query = query.eq('cycle_id', cycleId);
      if (themeId) query = query.eq('theme_id', themeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Nomination[];
    },
    enabled: !!tenantId,
  });

  // Nominations sent by current user
  const { data: myNominations = [], isPending: myPending } = useQuery({
    queryKey: ['my-nominations', user?.id, tenantId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .eq('nominator_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Nomination[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Nominations where current user is nominee
  const { data: receivedNominations = [], isPending: receivedPending } = useQuery({
    queryKey: ['received-nominations', user?.id, tenantId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .eq('nominee_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Nomination[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  const createNomination = useMutation({
    mutationFn: async (input: CreateNominationInput) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');
      const { data, error } = await supabase
        .from('nominations')
        .insert({
          ...input,
          tenant_id: tenantId,
          nominator_id: user.id,
          nominator_department_id: null,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nominations'] });
      qc.invalidateQueries({ queryKey: ['my-nominations'] });
      qc.invalidateQueries({ queryKey: ['manager-quota'] });
      toast.success(t('recognition.nominations.submitSuccess'));
    },
    onError: () => toast.error(t('recognition.nominations.submitError')),
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nominations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nominations'] });
      qc.invalidateQueries({ queryKey: ['my-nominations'] });
      toast.success(t('recognition.nominations.deleteSuccess'));
    },
    onError: () => toast.error(t('recognition.nominations.deleteError')),
  });

  return {
    nominations,
    myNominations,
    receivedNominations,
    isPending,
    myPending,
    receivedPending,
    createNomination,
    softDelete,
  };
}

/** Manager quota hook: tracks how many nominations a manager has used for a theme */
export function useManagerQuota(themeId?: string) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['manager-quota', user?.id, themeId, tenantId],
    queryFn: async () => {
      if (!user?.id || !themeId) return { used: 0, total: Infinity, remaining: Infinity, teamSize: 0 };

      // Count team members (direct reports)
      const { count: teamSize } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('manager_id', user.id)
        .is('deleted_at', null);

      const size = teamSize ?? 0;
      // Quota only applies for teams of 5+
      const maxNominations = size >= 5 ? Math.floor(size * 0.3) : size;

      // Count existing nominations by this manager for this theme
      const { count: used } = await supabase
        .from('nominations')
        .select('id', { count: 'exact', head: true })
        .eq('nominator_id', user.id)
        .eq('theme_id', themeId)
        .eq('nominator_role', 'manager')
        .is('deleted_at', null);

      const usedCount = used ?? 0;
      return {
        used: usedCount,
        total: maxNominations,
        remaining: Math.max(0, maxNominations - usedCount),
        teamSize: size,
      };
    },
    enabled: !!user?.id && !!themeId && !!tenantId,
  });
}
