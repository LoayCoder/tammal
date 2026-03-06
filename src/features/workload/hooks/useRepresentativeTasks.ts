import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UnifiedTask, TaskComment } from './useUnifiedTasks';

export interface RepresentativeAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  scope_type: 'division' | 'department' | 'section';
  scope_id: string;
}

export interface DistributeTaskPayload {
  employee_id: string;
  title: string;
  title_ar?: string;
  description?: string;
  due_date?: string;
  priority?: number;
  estimated_minutes?: number;
}

export interface BulkTaskPayload {
  employee_id: string;
  title: string;
  title_ar?: string;
  description?: string;
  due_date?: string;
  priority?: number;
  estimated_minutes?: number;
}

export interface ManageTaskPayload {
  task_id: string;
  action: 'edit' | 'delete' | 'extend_due_date';
  justification: string;
  title?: string;
  title_ar?: string;
  description?: string;
  priority?: number;
  estimated_minutes?: number;
  new_due_date?: string;
}

export interface ScopeEmployee {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
  section_id: string | null;
}

export function useRepresentativeTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  // Fetch user's representative assignments
  const assignmentsQuery = useQuery({
    queryKey: ['representative-assignments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representative_assignments')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return data as RepresentativeAssignment[];
    },
    enabled: !!user?.id,
  });

  // Fetch tasks created by this representative
  const tasksQuery = useQuery({
    queryKey: ['representative-tasks', user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('created_by', user!.id)
        .eq('source_type', 'representative_assigned')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => ({ ...d, comments: (d.comments as TaskComment[]) ?? [] })) as UnifiedTask[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Fetch employees filtered by department/section for the cascading picker
  const useEmployeesByScope = (departmentId?: string, sectionId?: string) => {
    return useQuery({
      queryKey: ['scope-employees', tenantId, departmentId, sectionId],
      queryFn: async () => {
        let query = supabase
          .from('employees')
          .select('id, full_name, email, department_id, section_id')
          .eq('tenant_id', tenantId!)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('full_name', { ascending: true });

        if (sectionId) {
          query = query.eq('section_id', sectionId);
        } else if (departmentId) {
          query = query.eq('department_id', departmentId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ScopeEmployee[];
      },
      enabled: !!tenantId && !!(departmentId || sectionId),
    });
  };

  // Single task distribution
  const distributeMutation = useMutation({
    mutationFn: async (payload: DistributeTaskPayload) => {
      const { data, error } = await supabase.functions.invoke('distribute-representative-task', {
        body: { ...payload, tenant_id: tenantId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { distributed: number; batch_id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['representative-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('representative.distributeSuccess', { count: data.distributed }));
    },
    onError: (err: Error) => toast.error(err.message || t('representative.distributeError')),
  });

  // Bulk task distribution
  const bulkDistributeMutation = useMutation({
    mutationFn: async (tasks: BulkTaskPayload[]) => {
      const { data, error } = await supabase.functions.invoke('distribute-representative-task', {
        body: { tenant_id: tenantId, mode: 'bulk', tasks },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { distributed: number; batch_id: string; errors?: Array<{ row: number; error: string }> };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['representative-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('representative.distributeSuccess', { count: data.distributed }));
      if (data.errors && data.errors.length > 0) {
        toast.warning(t('representative.bulkPartialErrors', { count: data.errors.length }));
      }
    },
    onError: (err: Error) => toast.error(err.message || t('representative.distributeError')),
  });

  // Manage task (edit / delete / extend due date)
  const manageMutation = useMutation({
    mutationFn: async (payload: ManageTaskPayload) => {
      const { data, error } = await supabase.functions.invoke('manage-representative-task', {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; action: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['representative-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['representative-batch-detail'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      const msgKey = data.action === 'delete' ? 'representative.deleteSuccess' : data.action === 'extend_due_date' ? 'representative.extendSuccess' : 'representative.editSuccess';
      toast.success(t(msgKey));
    },
    onError: (err: Error) => toast.error(err.message || t('representative.manageError')),
  });

  // Fetch batch detail (tasks + employee names) for completion matrix
  const useBatchDetail = (batchId: string | null) => {
    return useQuery({
      queryKey: ['representative-batch-detail', batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('unified_tasks')
          .select('id, employee_id, title, title_ar, description, status, updated_at, due_date, priority, estimated_minutes, due_date_history')
          .eq('source_id', batchId!)
          .eq('source_type', 'representative_assigned')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false });
        if (error) throw error;

        // Get employee names
        const empIds = [...new Set((data ?? []).map(t => t.employee_id))];
        let empMap: Record<string, string> = {};
        if (empIds.length > 0) {
          const { data: emps } = await supabase
            .from('employees')
            .select('id, full_name')
            .in('id', empIds);
          empMap = Object.fromEntries((emps ?? []).map(e => [e.id, e.full_name]));
        }

        return (data ?? []).map(t => ({
          ...t,
          employee_name: empMap[t.employee_id] ?? t.employee_id,
          due_date_history: (Array.isArray(t.due_date_history) ? t.due_date_history : []) as Array<{ old_due_date: string | null; new_due_date: string; changed_at: string; justification: string }>,
        }));
      },
      enabled: !!batchId,
    });
  };

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoadingAssignments: assignmentsQuery.isPending,
    tasks: tasksQuery.data ?? [],
    isLoadingTasks: tasksQuery.isPending,
    distributeTask: distributeMutation.mutateAsync,
    isDistributing: distributeMutation.isPending,
    bulkDistribute: bulkDistributeMutation.mutateAsync,
    isBulkDistributing: bulkDistributeMutation.isPending,
    manageTask: manageMutation.mutateAsync,
    isManaging: manageMutation.isPending,
    isRepresentative: (assignmentsQuery.data ?? []).length > 0,
    useEmployeesByScope,
    useBatchDetail,
  };
}
