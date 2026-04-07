import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export function useOnboardingTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTour, setShowTour] = useState(false);

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ['user-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-show for new users
  useEffect(() => {
    if (!isLoading && onboarding !== undefined) {
      if (!onboarding || !onboarding.tour_completed) {
        setShowTour(true);
      }
    }
  }, [isLoading, onboarding]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      // Upsert the onboarding row
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          tour_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowTour(false);
      queryClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          tour_completed: false,
          completed_at: null,
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowTour(true);
      queryClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    },
  });

  const completeTour = useCallback(() => completeMutation.mutate(), [completeMutation]);
  const resetTour = useCallback(() => resetMutation.mutate(), [resetMutation]);

  return {
    showTour,
    setShowTour,
    completeTour,
    resetTour,
    isLoading,
    isResetting: resetMutation.isPending,
  };
}
