import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useMemo } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';

export interface BreathingSession {
  id: string;
  employee_id: string;
  tenant_id: string;
  technique: string;
  duration_seconds: number;
  rounds_completed: number | null;
  rounds_target: number | null;
  mood_before: number | null;
  mood_after: number | null;
  completed: boolean;
  created_at: string;
}

export interface BreathingStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
  avgMoodImprovement: number;
  favoriteExercise: string | null;
  weeklyData: { date: string; count: number }[];
}

export function useBreathingSessions() {
  const { employee } = useCurrentEmployee();
  const employeeId = employee?.id ?? null;
  const tenantId = employee?.tenant_id ?? null;
  const queryClient = useQueryClient();

  const queryKey = ['breathing-sessions', employeeId];

  const { data: sessions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('breathing_sessions')
        .select('*')
        .eq('employee_id', employeeId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as BreathingSession[];
    },
    enabled: !!employeeId,
  });

  const stats: BreathingStats = useMemo(() => {
    const completed = sessions.filter(s => s.completed);
    const totalSessions = completed.length;
    const totalMinutes = Math.round(completed.reduce((s, r) => s + r.duration_seconds, 0) / 60);

    // Streaks
    const uniqueDays = [...new Set(completed.map(r => r.created_at.slice(0, 10)))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    if (uniqueDays.length > 0 && (uniqueDays[0] === today || uniqueDays[0] === yesterday)) {
      let expected = uniqueDays[0];
      for (const day of uniqueDays) {
        if (day === expected) {
          currentStreak++;
          expected = format(subDays(new Date(day), 1), 'yyyy-MM-dd');
        } else break;
      }
    }

    // Longest streak
    let tempStreak = 0;
    for (let i = 0; i < uniqueDays.length; i++) {
      if (i === 0) { tempStreak = 1; }
      else {
        const prev = format(subDays(new Date(uniqueDays[i - 1]), 1), 'yyyy-MM-dd');
        if (uniqueDays[i] === prev) tempStreak++;
        else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // This week/month
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const thisWeekSessions = completed.filter(r => r.created_at.slice(0, 10) >= weekAgo).length;
    const thisMonthSessions = completed.filter(r => r.created_at.slice(0, 10) >= monthStart).length;

    // Avg mood improvement
    const withBoth = completed.filter(r => r.mood_before != null && r.mood_after != null);
    const avgMoodImprovement = withBoth.length > 0
      ? Math.round((withBoth.reduce((s, r) => s + (r.mood_after! - r.mood_before!), 0) / withBoth.length) * 10) / 10
      : 0;

    // Favorite exercise
    const techCounts: Record<string, number> = {};
    for (const s of completed) {
      techCounts[s.technique] = (techCounts[s.technique] || 0) + 1;
    }
    const favoriteExercise = Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Weekly data (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      return { date: d, count: completed.filter(r => r.created_at.slice(0, 10) === d).length };
    });

    return {
      totalSessions, totalMinutes, currentStreak, longestStreak,
      thisWeekSessions, thisMonthSessions, avgMoodImprovement,
      favoriteExercise, weeklyData,
    };
  }, [sessions]);

  const startSessionMutation = useMutation({
    mutationFn: async (data: {
      technique: string;
      mood_before: number | null;
      rounds_target: number;
    }) => {
      if (!employeeId || !tenantId) throw new Error('No employee context');
      const { data: result, error } = await supabase
        .from('breathing_sessions')
        .insert({
          employee_id: employeeId,
          tenant_id: tenantId,
          technique: data.technique,
          mood_before: data.mood_before,
          rounds_target: data.rounds_target,
          duration_seconds: 0,
        })
        .select('id')
        .single();
      if (error) throw error;
      return result.id as string;
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      mood_after: number | null;
      rounds_completed: number;
      duration_seconds: number;
    }) => {
      const { error } = await supabase
        .from('breathing_sessions')
        .update({
          mood_after: data.mood_after,
          rounds_completed: data.rounds_completed,
          duration_seconds: data.duration_seconds,
          completed: true,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['breathing-stats', employeeId] });
    },
  });

  return {
    sessions,
    isLoading,
    stats,
    startSession: startSessionMutation.mutateAsync,
    completeSession: completeSessionMutation.mutateAsync,
    isStarting: startSessionMutation.isPending,
    isCompleting: completeSessionMutation.isPending,
  };
}
