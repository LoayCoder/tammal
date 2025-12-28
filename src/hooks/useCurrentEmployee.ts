import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurrentEmployee {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  department: string | null;
  role_title: string | null;
  status: string;
}

export function useCurrentEmployee() {
  const { user } = useAuth();

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['current-employee', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data as CurrentEmployee | null;
    },
    enabled: !!user?.id,
  });

  return {
    employee,
    isLoading,
    error,
    hasEmployeeProfile: !!employee,
  };
}