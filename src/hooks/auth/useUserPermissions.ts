import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export function useUserPermissions() {
  const { user, loading: authLoading } = useAuth();

  const permissionsQuery = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all permissions for the user through their roles
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          custom_role_id,
          role,
          roles:custom_role_id (
            id,
            role_permissions (
              permissions (
                code
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Extract unique permission codes
      const permissionCodes = new Set<string>();
      
      // Check if user has super_admin role - they have all permissions
      const isSuperAdmin = data?.some(ur => ur.role === 'super_admin');
      if (isSuperAdmin) {
        // Return a special marker for super admin
        return ['*'];
      }

      data?.forEach(userRole => {
        const role = userRole.roles as any;
        if (role?.role_permissions) {
          role.role_permissions.forEach((rp: any) => {
            if (rp.permissions?.code) {
              permissionCodes.add(rp.permissions.code);
            }
          });
        }
      });

      return Array.from(permissionCodes);
    },
    enabled: !!user?.id && !authLoading,
  });

  const permissions = permissionsQuery.data ?? [];

  const hasPermission = (code: string): boolean => {
    if (permissions.includes('*')) return true; // Super admin
    return permissions.includes(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (permissions.includes('*')) return true; // Super admin
    return codes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (codes: string[]): boolean => {
    if (permissions.includes('*')) return true; // Super admin
    return codes.every(code => permissions.includes(code));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // CRITICAL: isLoading must be true while auth is initializing OR while the
    // query is pending. TanStack Query v5 isPending captures the "idle" state
    // (when enabled=false) unlike isLoading which returns false when idle.
    isLoading: authLoading || permissionsQuery.isPending,
    isSuperAdmin: permissions.includes('*'),
  };
}

export function useHasRole(role: 'super_admin' | 'tenant_admin' | 'manager' | 'user') {
  const { user, loading: authLoading } = useAuth();

  const { data: hasRole = false, isPending } = useQuery({
    queryKey: ['has-role', user?.id, role],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', role)
        .maybeSingle();

      if (error) {
        logger.error('useHasRole', 'Error checking role', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !authLoading,
  });

  return {
    hasRole,
    // CRITICAL: must stay true while auth is loading OR query is pending (idle)
    isLoading: authLoading || isPending,
  };
}
