import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useMemo } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';

export interface ThoughtReframe {
  id: string;
  employee_id: string;
  tenant_id: string;
  negative_thought: string;
  challenge_answers: { q1?: string; q2?: string; q3?: string } | null;
  reframed_thought: string;
  created_at: string;
}

export interface ReframeStats {
  total: number;
  thisMonth: number;
  streak: number;
}

export function useThoughtReframes() {
  const { employee } = useCurrentEmployee();
  const employeeId = employee?.id ?? null;
  const tenantId = employee?.tenant_id ?? null;
  const queryClient = useQueryClient();

  const queryKey = ['thought-reframes', employeeId];

  const { data: reframes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('thought_reframes')
        .select('*')
        .eq('employee_id', employeeId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ThoughtReframe[];
    },
    enabled: !!employeeId,
  });

  const stats: ReframeStats = useMemo(() => {
    if (!reframes.length) return { total: 0, thisMonth: 0, streak: 0 };

    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const thisMonth = reframes.filter(
      (r) => r.created_at.slice(0, 10) >= monthStart
    ).length;

    // Calculate streak (consecutive days with at least one reframe, ending today or yesterday)
    const uniqueDays = [...new Set(reframes.map((r) => r.created_at.slice(0, 10)))].sort().reverse();
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
      let expectedDate = uniqueDays[0];
      for (const day of uniqueDays) {
        if (day === expectedDate) {
          streak++;
          expectedDate = format(subDays(new Date(day), 1), 'yyyy-MM-dd');
        } else {
          break;
        }
      }
    }

    return { total: reframes.length, thisMonth, streak };
  }, [reframes]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      negative_thought: string;
      challenge_answers: Record<string, string>;
      reframed_thought: string;
    }) => {
      if (!employeeId || !tenantId) throw new Error('No employee context');
      const { error } = await supabase.from('thought_reframes').insert({
        employee_id: employeeId,
        tenant_id: tenantId,
        negative_thought: data.negative_thought,
        challenge_answers: data.challenge_answers,
        reframed_thought: data.reframed_thought,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['reframe-stats', employeeId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('thought_reframes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['reframe-stats', employeeId] });
    },
  });

  return {
    reframes,
    isLoading,
    stats,
    saveReframe: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteReframe: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
