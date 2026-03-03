import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AutonomousAuditLogEntry } from '@/features/ai-governance/types';

export interface AutonomousStateRow {
  tenant_id: string;
  feature: string;
  current_weights: Record<string, number>;
  previous_weights_history: Record<string, number>[];
  last_adjustment: string | null;
  adjustment_score: number;
  mode: 'enabled' | 'disabled' | 'shadow';
  exploration_boost: number;
  anomaly_frozen_until: string | null;
  hyperparams: { decay_window: number; smoothing_alpha: number; drift_threshold: number };
}

export function useAutonomousState() {
  return useQuery({
    queryKey: ['ai-governance', 'autonomous-state'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_autonomous_state' },
      });
      if (error) throw error;
      return (data?.data ?? []) as AutonomousStateRow[];
    },
    staleTime: 30_000,
  });
}

export function useAutonomousAuditLog(limit = 50) {
  return useQuery({
    queryKey: ['ai-governance', 'autonomous-audit-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_autonomous_audit_log', params: { limit } },
      });
      if (error) throw error;
      return (data?.data ?? []) as AutonomousAuditLogEntry[];
    },
    staleTime: 30_000,
  });
}
