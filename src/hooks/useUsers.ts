import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;

export interface UserWithRoles extends Profile {
  user_roles: (UserRole & { 
    roles?: {
      id: string;
      name: string;
      name_ar: string | null;
      color: string;
    } | null;
  })[];
  email?: string;
}

export interface UserFilters {
  tenantId?: string;
  role?: string;
  search?: string;
}

export function useUsers(filters?: UserFilters) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Fetch user roles separately
      const userIds = profiles.map(p => p.user_id);
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      // Map roles to users
      return profiles.map(profile => ({
        ...profile,
        user_roles: (userRolesData || []).filter(ur => ur.user_id === profile.user_id)
      })) as UserWithRoles[];
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
  };
}

export function useUserRoles(userId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const userRolesQuery = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles:custom_role_id(id, name, name_ar, color, description)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const assignRole = useMutation({
    mutationFn: async ({ 
      userId, 
      customRoleId, 
      role = 'user' 
    }: { 
      userId: string; 
      customRoleId?: string; 
      role?: 'super_admin' | 'tenant_admin' | 'manager' | 'user';
    }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role,
          custom_role_id: customRoleId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.roleAssignSuccess'));
    },
    onError: (error) => {
      toast.error(t('users.roleAssignError'));
      console.error('Assign role error:', error);
    },
  });

  const removeRole = useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.roleRemoveSuccess'));
    },
    onError: (error) => {
      toast.error(t('users.roleRemoveError'));
      console.error('Remove role error:', error);
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ 
      userRoleId, 
      customRoleId 
    }: { 
      userRoleId: string; 
      customRoleId: string | null;
    }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ custom_role_id: customRoleId })
        .eq('id', userRoleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.roleUpdateSuccess'));
    },
    onError: (error) => {
      toast.error(t('users.roleUpdateError'));
      console.error('Update user role error:', error);
    },
  });

  return {
    userRoles: userRolesQuery.data ?? [],
    isLoading: userRolesQuery.isLoading,
    error: userRolesQuery.error,
    assignRole,
    removeRole,
    updateUserRole,
  };
}

export function useHasPermission(permissionCode: string) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: hasPermission } = useQuery({
    queryKey: ['has-permission', user?.id, permissionCode],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc('has_permission', { _user_id: user.id, _permission_code: permissionCode });
      
      if (error) {
        console.error('Permission check error:', error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user?.id,
  });

  return hasPermission ?? false;
}
