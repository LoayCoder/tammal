import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Fetch user IDs with manager+ roles for manager picker filtering */
export function useManagerEligibleUserIds() {
  return useQuery({
    queryKey: ['manager-eligible-user-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['manager', 'tenant_admin', 'super_admin']);
      if (error) throw error;
      return [...new Set((data || []).map(r => r.user_id))];
    },
  });
}
