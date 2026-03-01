import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useGovernanceMutation(action: string, invalidateKeys: string[][] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action, params },
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-governance'] });
      for (const k of invalidateKeys) {
        qc.invalidateQueries({ queryKey: k });
      }
    },
  });
}

export function useSwitchStrategy() {
  return useGovernanceMutation('switch_strategy');
}

export function useResetPosterior() {
  return useGovernanceMutation('reset_posterior');
}

export function useApplyPenalty() {
  return useGovernanceMutation('apply_penalty');
}

export function useClearPenalty() {
  return useGovernanceMutation('clear_penalty');
}

export function useUpdateBudget() {
  return useGovernanceMutation('update_budget');
}

export function useRefreshSummary() {
  return useGovernanceMutation('refresh_summary');
}

export function usePenalties() {
  return useQuery({
    queryKey: ['ai-governance', 'penalties'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_penalties' },
      });
      if (error) throw error;
      return (data?.data ?? []) as any[];
    },
    staleTime: 30_000,
  });
}

export function useBudgetConfig() {
  return useQuery({
    queryKey: ['ai-governance', 'budget-config'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_budget_config' },
      });
      if (error) throw error;
      return data?.data as Record<string, unknown> | null;
    },
    staleTime: 60_000,
  });
}

export function useGovernanceAuditLog(limit = 50) {
  return useQuery({
    queryKey: ['ai-governance', 'audit-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_audit_log', params: { limit } },
      });
      if (error) throw error;
      return (data?.data ?? []) as any[];
    },
    staleTime: 30_000,
  });
}
