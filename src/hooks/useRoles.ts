import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from './useAuditLog';

export interface Role {
  id: string;
  tenant_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  is_system_role: boolean;
  base_role: 'super_admin' | 'tenant_admin' | 'manager' | 'user';
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRoleInput {
  tenant_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  base_role?: 'super_admin' | 'tenant_admin' | 'manager' | 'user';
  color?: string;
}

export interface UpdateRoleInput {
  id: string;
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  base_role?: 'super_admin' | 'tenant_admin' | 'manager' | 'user';
  color?: string;
}

export function useRoles(tenantId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  const rolesQuery = useQuery({
    queryKey: ['roles', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('roles')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Role[];
    },
  });

  const createRole = useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          tenant_id: input.tenant_id,
          name: input.name,
          name_ar: input.name_ar || null,
          description: input.description || null,
          description_ar: input.description_ar || null,
          base_role: input.base_role || 'user',
          color: input.color || '#6366f1',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.createSuccess'));
      
      logEvent({
        tenant_id: data.tenant_id,
        entity_type: 'role',
        entity_id: data.id,
        action: 'create',
        changes: { after: data },
        metadata: { role_name: data.name },
      });
    },
    onError: (error) => {
      toast.error(t('roles.createError'));
      console.error('Create role error:', error);
    },
  });

  const updateRole = useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      const { id, ...updates } = input;
      
      // Fetch before state for audit
      const { data: before } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.updateSuccess'));
      
      logEvent({
        tenant_id: data.tenant_id,
        entity_type: 'role',
        entity_id: data.id,
        action: 'update',
        changes: { before, after: data },
        metadata: { role_name: data.name },
      });
    },
    onError: (error) => {
      toast.error(t('roles.updateError'));
      console.error('Update role error:', error);
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      // Fetch before state for audit
      const { data: before } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();
      
      const { error } = await supabase
        .from('roles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', roleId);

      if (error) throw error;
      return { roleId, before };
    },
    onSuccess: ({ roleId, before }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.deleteSuccess'));
      
      logEvent({
        tenant_id: before?.tenant_id,
        entity_type: 'role',
        entity_id: roleId,
        action: 'delete',
        changes: { before },
        metadata: { role_name: before?.name },
      });
    },
    onError: (error) => {
      toast.error(t('roles.deleteError'));
      console.error('Delete role error:', error);
    },
  });

  return {
    roles: rolesQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
    error: rolesQuery.error,
    createRole,
    updateRole,
    deleteRole,
  };
}
