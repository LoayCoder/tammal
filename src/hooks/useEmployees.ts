import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Json } from '@/integrations/supabase/types';

export type EmployeeStatus = 'active' | 'resigned' | 'terminated';

export interface Employee {
  id: string;
  tenant_id: string;
  user_id: string | null;
  employee_number: string | null;
  full_name: string;
  email: string;
  department: string | null;
  role_title: string | null;
  manager_id: string | null;
  hire_date: string | null;
  status: EmployeeStatus;
  metadata: Json;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  manager?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CreateEmployeeInput {
  tenant_id: string;
  full_name: string;
  email: string;
  employee_number?: string;
  department?: string;
  role_title?: string;
  manager_id?: string;
  hire_date?: string;
  status?: EmployeeStatus;
  metadata?: Json;
}

export interface EmployeeFilters {
  department?: string;
  status?: EmployeeStatus;
  search?: string;
}

export function useEmployees(filters?: EmployeeFilters) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select(`
          *,
          manager:employees!employees_manager_id_fkey (
            id,
            full_name
          )
        `)
        .is('deleted_at', null)
        .order('full_name', { ascending: true });

      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(emp => ({
        ...emp,
        manager: Array.isArray(emp.manager) && emp.manager.length > 0 ? emp.manager[0] : null
      })) as Employee[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['employee-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .is('deleted_at', null)
        .not('department', 'is', null);

      if (error) throw error;
      const uniqueDepts = [...new Set(data.map(d => d.department).filter(Boolean))] as string[];
      return uniqueDepts.sort();
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          tenant_id: input.tenant_id,
          full_name: input.full_name,
          email: input.email,
          employee_number: input.employee_number,
          department: input.department,
          role_title: input.role_title,
          manager_id: input.manager_id,
          hire_date: input.hire_date,
          status: input.status || 'active',
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      toast.success(t('employees.createSuccess'));
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error(t('employees.duplicateEmail'));
      } else {
        toast.error(t('employees.createError'));
      }
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, manager, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      toast.success(t('employees.updateSuccess'));
    },
    onError: () => {
      toast.error(t('employees.updateError'));
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(t('employees.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('employees.deleteError'));
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (employees: CreateEmployeeInput[]) => {
      const insertData = employees.map(emp => ({
        tenant_id: emp.tenant_id,
        full_name: emp.full_name,
        email: emp.email,
        employee_number: emp.employee_number,
        department: emp.department,
        role_title: emp.role_title,
        manager_id: emp.manager_id,
        hire_date: emp.hire_date,
        status: emp.status || 'active',
        metadata: emp.metadata || {},
      }));
      
      const { data, error } = await supabase
        .from('employees')
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      toast.success(t('employees.importSuccess', { count: data.length }));
    },
    onError: () => {
      toast.error(t('employees.importError'));
    },
  });

  return {
    employees,
    departments,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImport,
  };
}
