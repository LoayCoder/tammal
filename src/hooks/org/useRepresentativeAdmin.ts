import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface RepresentativeAssignmentAdmin {
  id: string;
  tenant_id: string;
  user_id: string;
  scope_type: 'division' | 'department' | 'section';
  scope_id: string;
  created_at: string;
}

export interface CreateRepresentativeInput {
  user_id: string;
  scope_type: 'division' | 'department' | 'section';
  scope_id: string;
}

export function useRepresentativeAdmin(tenantId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['representative-admin', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representative_assignments')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RepresentativeAssignmentAdmin[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateRepresentativeInput) => {
      const { error } = await supabase.from('representative_assignments').insert({
        tenant_id: tenantId!,
        user_id: input.user_id,
        scope_type: input.scope_type,
        scope_id: input.scope_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representative-admin'] });
      toast.success(t('representative.admin.addSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('representative_assignments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representative-admin'] });
      toast.success(t('representative.admin.removeSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isPending: assignmentsQuery.isPending,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    remove: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
