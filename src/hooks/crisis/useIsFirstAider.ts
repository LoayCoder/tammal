import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export function useIsFirstAider() {
  const { user } = useAuth();
  const { data: firstAiderId, isPending } = useQuery({
    queryKey: ['is-first-aider', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_first_aiders')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!user?.id,
  });
  return { isFirstAider: !!firstAiderId, firstAiderId, isPending };
}