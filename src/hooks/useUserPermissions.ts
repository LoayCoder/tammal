import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserPermissions() {
  const { user } = useAuth();

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
    enabled: !!user?.id,
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
    isLoading: permissionsQuery.isLoading,
    isSuperAdmin: permissions.includes('*'),
  };
}
