import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;

export interface UserWithRoles extends Omit<Profile, 'status'> {
  user_roles: (UserRole & { 
    roles?: {
      id: string;
      name: string;
      name_ar: string | null;
      color: string;
    } | null;
  })[];
  email?: string;
  status: string;
}

export interface UserFilters {
  tenantId?: string;
  role?: string;
  search?: string;
  status?: string;
}

export function useUsers(filters?: UserFilters) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      // If no tenantId provided, return empty array
      if (!filters?.tenantId) {
        return [] as UserWithRoles[];
      }

      // Query from the profiles_with_email view to get emails
      let query = supabase
        .from('profiles_with_email')
        .select('*')
        .eq('tenant_id', filters.tenantId)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        return [] as UserWithRoles[];
      }

      // Fetch user roles WITH custom role details
      const userIds = profiles.map((p: any) => p.user_id);
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          custom_role_id,
          created_at,
          roles:custom_role_id(id, name, name_ar, color)
        `)
        .in('user_id', userIds);

      if (rolesError) {
        logger.error('useUsers', 'Error fetching user roles', rolesError);
      }

      // Map roles to users
      return profiles.map((profile: any) => ({
        ...profile,
        user_roles: (userRolesData || [])
          .filter(ur => ur.user_id === profile.user_id)
          .map(ur => ({
            ...ur,
            roles: ur.roles as { id: string; name: string; name_ar: string | null; color: string } | null
          }))
      })) as UserWithRoles[];
    },
    enabled: !!filters?.tenantId,
  });

  // Mutation to update profile (name, status, job_title, department, phone, location, avatar_url)
  const updateProfile = useMutation({
    mutationFn: async ({ 
      id, 
      full_name, 
      status, 
      job_title, 
      department, 
      phone, 
      location,
      avatar_url 
    }: { 
      id: string; 
      full_name?: string; 
      status?: string;
      job_title?: string;
      department?: string;
      phone?: string;
      location?: string;
      avatar_url?: string | null;
    }) => {
      const updates: Record<string, any> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (status !== undefined) updates.status = status;
      if (job_title !== undefined) updates.job_title = job_title;
      if (department !== undefined) updates.department = department;
      if (phone !== undefined) updates.phone = phone;
      if (location !== undefined) updates.location = location;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updateSuccess'));
    },
    onError: (error) => {
      toast.error(t('users.updateError'));
      logger.error('useUsers', 'Update profile failed', error);
    },
  });

  // Mutation to send password reset email
  const sendPasswordReset = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: userId, email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send password reset');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(t('users.passwordResetSent'));
    },
    onError: (error) => {
      toast.error(t('users.passwordResetError'));
      logger.error('useUsers', 'Password reset failed', error);
    },
  });

  // Mutation to change user status
  const changeUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const statusMessage = variables.status === 'active' 
        ? t('users.reactivateSuccess')
        : variables.status === 'suspended'
          ? t('users.suspendSuccess')
          : t('users.deactivateSuccess');
      toast.success(statusMessage);
    },
    onError: (error) => {
      toast.error(t('users.statusChangeError'));
      logger.error('useUsers', 'Status change failed', error);
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    updateProfile,
    changeUserStatus,
    sendPasswordReset,
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
      logger.error('useUsers', 'Assign role failed', error);
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
      logger.error('useUsers', 'Remove role failed', error);
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
      logger.error('useUsers', 'Update user role failed', error);
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

/**
 * @deprecated Use `useUserPermissions().hasPermission(code)` from
 * `@/hooks/auth/useUserPermissions` instead. This hook makes a redundant
 * RPC call and will be removed in a future release.
 */
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
        logger.error('useUsers', 'Permission check error', error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user?.id,
  });

  return hasPermission ?? false;
}
