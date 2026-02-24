import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type AuditLog = Tables<'audit_logs'>;
export type AuditLogInsert = TablesInsert<'audit_logs'>;

export type AuditAction = 'create' | 'update' | 'delete' | 'module_toggle' | 'status_change' | 'permission_change';
export type EntityType = 'tenant' | 'subscription' | 'user' | 'plan' | 'role' | 'permission' | 'user_role' | 'strategic_objective' | 'initiative' | 'objective_action';

interface LogEventParams {
  tenant_id?: string | null;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export function useAuditLog(options?: { tenantId?: string; limit?: number }) {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['audit-logs', options?.tenantId, options?.limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const logEventMutation = useMutation({
    mutationFn: async (params: LogEventParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const logEntry: AuditLogInsert = {
        tenant_id: params.tenant_id,
        user_id: user?.id || null,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        action: params.action,
        changes: params.changes || {},
        metadata: params.metadata || {},
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logEntry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });

  const logEvent = async (params: LogEventParams) => {
    try {
      await logEventMutation.mutateAsync(params);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  return {
    logs: logsQuery.data ?? [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    logEvent,
    isLogging: logEventMutation.isPending,
  };
}
