import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCallback } from 'react';

export interface EmployeeCapacity {
  id: string;
  tenant_id: string;
  user_id: string;
  daily_capacity_minutes: number;
  weekly_capacity_minutes: number;
  max_concurrent_actions: number;
  created_at: string;
  updated_at: string;
}

const DEFAULTS = {
  daily_capacity_minutes: 480,
  weekly_capacity_minutes: 2400,
  max_concurrent_actions: 12,
} as const;

export function useEmployeeCapacity(employeeId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const queryKey = ['employee-capacity', tenantId, employeeId];

  const capacityQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('employee_capacity')
        .select('*')
        .is('deleted_at', null);
      if (employeeId) query = query.eq('user_id', employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as EmployeeCapacity[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: {
      user_id: string;
      daily_capacity_minutes?: number;
      weekly_capacity_minutes?: number;
      max_concurrent_actions?: number;
    }) => {
      const { data, error } = await supabase
        .from('employee_capacity')
        .upsert(
          { tenant_id: tenantId!, ...DEFAULTS, ...item },
          { onConflict: 'tenant_id,user_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-capacity', tenantId] });
      toast.success(t('workload.capacity.updateSuccess', 'Capacity updated'));
    },
    onError: () => toast.error(t('workload.capacity.updateError', 'Failed to update capacity')),
  });

  const getCapacityFor = useCallback(
    (empId: string): EmployeeCapacity | undefined =>
      capacityQuery.data?.find(c => c.user_id === empId),
    [capacityQuery.data],
  );

  return {
    capacities: capacityQuery.data ?? [],
    isPending: capacityQuery.isPending,
    upsertCapacity: upsertMutation.mutate,
    isUpserting: upsertMutation.isPending,
    getCapacityFor,
    DEFAULTS,
  };
}
