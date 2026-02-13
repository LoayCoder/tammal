import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from './useAuditLog';

export interface Permission {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface PermissionsByCategory {
  category: string;
  permissions: Permission[];
}

export function usePermissions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      return data as Permission[];
    },
  });

  // Group permissions by category
  const permissionsByCategory: PermissionsByCategory[] = 
    permissionsQuery.data?.reduce((acc: PermissionsByCategory[], perm) => {
      const existing = acc.find(g => g.category === perm.category);
      if (existing) {
        existing.permissions.push(perm);
      } else {
        acc.push({ category: perm.category, permissions: [perm] });
      }
      return acc;
    }, []) ?? [];

  return {
    permissions: permissionsQuery.data ?? [],
    permissionsByCategory,
    isLoading: permissionsQuery.isLoading,
    error: permissionsQuery.error,
  };
}

export function useRolePermissions(roleId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  const rolePermissionsQuery = useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: async () => {
      if (!roleId) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*, permissions(*)')
        .eq('role_id', roleId);

      if (error) throw error;
      return data as (RolePermission & { permissions: Permission })[];
    },
    enabled: !!roleId,
  });

  const assignPermission = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success(t('permissions.assignSuccess'));
    },
    onError: (error) => {
      toast.error(t('permissions.assignError'));
      console.error('Assign permission error:', error);
    },
  });

  const removePermission = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success(t('permissions.removeSuccess'));
    },
    onError: (error) => {
      toast.error(t('permissions.removeError'));
      console.error('Remove permission error:', error);
    },
  });

  const updateRolePermissions = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      // Fetch before state for audit
      const { data: beforePerms } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      
      const beforePermissionIds = beforePerms?.map(p => p.permission_id) ?? [];
      
      // Delete all existing permissions for this role
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissionIds.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionIds.map(pid => ({ role_id: roleId, permission_id: pid })));

        if (insertError) throw insertError;
      }
      
      return { roleId, beforePermissionIds, afterPermissionIds: permissionIds };
    },
    onSuccess: ({ roleId, beforePermissionIds, afterPermissionIds }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success(t('permissions.updateSuccess'));
      
      logEvent({
        entity_type: 'permission',
        entity_id: roleId,
        action: 'permission_change',
        changes: { 
          before: beforePermissionIds, 
          after: afterPermissionIds,
          added: afterPermissionIds.filter(id => !beforePermissionIds.includes(id)),
          removed: beforePermissionIds.filter(id => !afterPermissionIds.includes(id)),
        },
        metadata: { 
          role_id: roleId,
          permissions_count: afterPermissionIds.length,
        },
      });
    },
    onError: (error) => {
      toast.error(t('permissions.updateError'));
      console.error('Update role permissions error:', error);
    },
  });

  const permissionIds = React.useMemo(
    () => rolePermissionsQuery.data?.map(rp => rp.permission_id) ?? [],
    [rolePermissionsQuery.data]
  );

  return {
    rolePermissions: rolePermissionsQuery.data ?? [],
    permissionIds,
    isLoading: rolePermissionsQuery.isLoading,
    error: rolePermissionsQuery.error,
    assignPermission,
    removePermission,
    updateRolePermissions,
  };
}
