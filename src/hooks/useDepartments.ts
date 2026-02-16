import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Department {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  branch_id: string | null;
  division_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  head_employee_id: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DepartmentInput {
  tenant_id: string;
  parent_id?: string | null;
  branch_id?: string | null;
  division_id?: string | null;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  head_employee_id?: string | null;
  color?: string;
  sort_order?: number;
}

export function useDepartments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Department[];
    },
  });

  const createDepartment = useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('organization.createSuccess'));
    },
    onError: () => toast.error(t('organization.createError')),
  });

  const updateDepartment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Department> & { id: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('organization.updateSuccess'));
    },
    onError: () => toast.error(t('organization.updateError')),
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('organization.deleteSuccess'));
    },
    onError: () => toast.error(t('organization.deleteError')),
  });

  return { departments, isLoading, createDepartment, updateDepartment, deleteDepartment };
}
