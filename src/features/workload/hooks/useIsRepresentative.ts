import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Lightweight hook to check if the current user has any representative assignments.
 */
export function useIsRepresentative() {
  const { user } = useAuth();

  const { data, isPending } = useQuery({
    queryKey: ['is-representative', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('representative_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  return {
    isRepresentative: data ?? false,
    isPending,
  };
}
