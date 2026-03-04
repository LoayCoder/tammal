import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface DelayPrediction {
  initiativeId: string;
  initiativeTitle: string;
  predictedDelayDays: number;
  confidence: number;
  riskFactors: string[];
  suggestedActions: string[];
}

export interface RedistributionSuggestion {
  fromEmployeeId: string;
  toEmployeeId: string;
  reason: string;
  estimatedImpact: {
    fromUtilizationAfter: number;
    toUtilizationAfter: number;
  };
}

export function useDelayPredictions() {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['workload-intelligence', 'delay-predictions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('workload-intelligence', {
        body: { action: 'predict_delays' },
      });
      if (error) throw error;
      return (data?.data ?? []) as DelayPrediction[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });
}

export function useRedistributionSuggestions() {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['workload-intelligence', 'redistribution', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('workload-intelligence', {
        body: { action: 'suggest_redistribution' },
      });
      if (error) throw error;
      return (data?.data ?? []) as RedistributionSuggestion[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });
}

export function useRunEscalationCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('escalation-check', {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation-events'] });
    },
  });
}
