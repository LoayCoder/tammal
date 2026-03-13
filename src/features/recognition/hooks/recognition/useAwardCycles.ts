import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export type CycleStatus = 'configuring' | 'nominating' | 'voting' | 'calculating' | 'announced' | 'archived';

export interface AwardCycle {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  created_by: string;
  status: CycleStatus;
  nomination_start: string;
  nomination_end: string;
  peer_endorsement_end: string;
  voting_start: string;
  voting_end: string;
  audit_review_days: number;
  announcement_date: string;
  fairness_config: Record<string, any>;
  points_config: Record<string, number>;
  stats: Record<string, any>;
  shortlist_count: number;
  require_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCycleInput {
  name: string;
  name_ar?: string;
  nomination_start: string;
  nomination_end: string;
  peer_endorsement_end: string;
  voting_start: string;
  voting_end: string;
  audit_review_days?: number;
  announcement_date: string;
  fairness_config?: Record<string, any>;
  shortlist_count?: number;
  require_acknowledgment?: boolean;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  configuring: ['nominating'],
  nominating: ['voting'],
  voting: ['calculating'],
  calculating: ['announced'],
  announced: ['archived'],
};

export function useAwardCycles() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: cycles = [], isPending } = useQuery({
    queryKey: ['award-cycles', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_cycles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AwardCycle[];
    },
    enabled: !!tenantId,
  });

  const createCycle = useMutation({
    mutationFn: async (input: CreateCycleInput) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');
      const { data, error } = await supabase
        .from('award_cycles')
        .insert({ ...input, tenant_id: tenantId, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-cycles'] });
      toast.success(t('recognition.cycles.createSuccess'));
    },
    onError: () => toast.error(t('recognition.cycles.createError')),
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AwardCycle> & { id: string }) => {
      const { data, error } = await supabase
        .from('award_cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-cycles'] });
      toast.success(t('recognition.cycles.updateSuccess'));
    },
    onError: () => toast.error(t('recognition.cycles.updateError')),
  });

  const advanceStatus = useMutation({
    mutationFn: async ({ id, currentStatus, newStatus }: { id: string; currentStatus: string; newStatus: CycleStatus }) => {
      if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
      }
      const { data, error } = await supabase
        .from('award_cycles')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-cycles'] });
      toast.success(t('recognition.cycles.statusAdvanced'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invalidateAllRecognition = () => {
    qc.invalidateQueries({ queryKey: ['award-cycles'] });
    qc.invalidateQueries({ queryKey: ['nominations'] });
    qc.invalidateQueries({ queryKey: ['my-nominations'] });
    qc.invalidateQueries({ queryKey: ['received-nominations'] });
    qc.invalidateQueries({ queryKey: ['votes'] });
    qc.invalidateQueries({ queryKey: ['endorsements'] });
    qc.invalidateQueries({ queryKey: ['award-themes'] });
    qc.invalidateQueries({ queryKey: ['judging-criteria'] });
    qc.invalidateQueries({ queryKey: ['theme-results'] });
    qc.invalidateQueries({ queryKey: ['pending-approvals'] });
  };

  const restoreCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('award_cycles')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllRecognition();
      toast.success(t('recognition.cycles.restoreSuccess'));
    },
    onError: () => toast.error(t('recognition.cycles.restoreError')),
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('award_cycles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (_data, deletedId) => {
      invalidateAllRecognition();
      toast.success(t('recognition.cycles.deleteSuccess'), {
        action: {
          label: t('recognition.cycles.undo'),
          onClick: () => restoreCycle.mutate(deletedId),
        },
        duration: 8000,
      });
    },
    onError: () => toast.error(t('recognition.cycles.deleteError')),
  });

  return { cycles, isPending, createCycle, updateCycle, advanceStatus, deleteCycle, restoreCycle };
}

