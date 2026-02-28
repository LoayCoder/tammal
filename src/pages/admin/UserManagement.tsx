import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Users, Shield, UserPlus, Building2 } from 'lucide-react';
import { useUsers, type UserWithRoles } from '@/hooks/org/useUsers';
import { useRoles, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/hooks/auth/useRoles';
import { useProfile } from '@/hooks/auth/useProfile';
import { useTenants } from '@/hooks/org/useTenants';
import { useHasRole } from '@/hooks/auth/useUserPermissions';
import { UserTable } from '@/components/users/UserTable';
import { UserRoleDialog } from '@/components/users/UserRoleDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserStatusDialog, type StatusAction } from '@/components/users/UserStatusDialog';
import { RoleTable } from '@/components/roles/RoleTable';
import { RoleDialog } from '@/components/roles/RoleDialog';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Get profile for tenant_id and check if user is super_admin
  const { profile, isPending: profileLoading } = useProfile();
  const { hasRole: isSuperAdmin } = useHasRole('super_admin');
  const { tenants, isPending: tenantsLoading } = useTenants();
  
  // State for tenant selection (super_admin only)
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(undefined);
  
  // Determine effective tenant ID
  const effectiveTenantId = isSuperAdmin 
    ? (selectedTenantId || tenants?.[0]?.id)
    : profile?.tenant_id || undefined;
  
  // Auto-select first tenant for super_admin when tenants load
  useEffect(() => {
    if (isSuperAdmin && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, tenants, selectedTenantId]);
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction>('deactivate');
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);
  
  const { users, isPending: usersLoading, updateProfile, changeUserStatus, sendPasswordReset } = useUsers({ 
    tenantId: effectiveTenantId, 
    search: userSearch 
  });
  const { roles, isPending: rolesLoading, createRole, updateRole, deleteRole } = useRoles(effectiveTenantId);

  const handleEditUserRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsUserRoleDialogOpen(true);
  };

  const handleViewUserDetails = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleStatusAction = (user: UserWithRoles, action: StatusAction) => {
    setSelectedUser(user);
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const handleSaveUser = async (userId: string, data: { full_name?: string; status?: string; job_title?: string; department?: string; phone?: string; location?: string; avatar_url?: string | null }) => {
    await updateProfile.mutateAsync({ id: userId, ...data });
  };

  const handlePasswordReset = async (userId: string, email: string) => {
    await sendPasswordReset.mutateAsync({ userId, email });
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser) return;
    
    const statusMap: Record<StatusAction, 'active' | 'inactive' | 'suspended'> = {
      deactivate: 'inactive',
      suspend: 'suspended',
      reactivate: 'active',
      delete: 'inactive', // For delete, we'll set to inactive (soft delete)
    };
    
    await changeUserStatus.mutateAsync({ 
      id: selectedUser.id, 
      status: statusMap[statusAction] 
    });
    setIsStatusDialogOpen(false);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionMatrixOpen(true);
  };

  const handleSaveRole = async (data: CreateRoleInput | UpdateRoleInput) => {
    if ('id' in data) {
      await updateRole.mutateAsync(data);
    } else {
      await createRole.mutateAsync(data);
    }
    setIsRoleDialogOpen(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    await deleteRole.mutateAsync(roleId);
  };

  // Get selected tenant name for display
  const selectedTenant = tenants?.find(t => t.id === effectiveTenantId);

  // Show loading state while fetching initial data
  if (profileLoading || (isSuperAdmin && tenantsLoading)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show message if no tenant is available
  if (!effectiveTenantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t('users.noTenantSelected')}</h3>
        <p className="text-muted-foreground">{t('users.selectTenantToManage')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
        
        {/* Tenant Selector for Super Admins */}
        {isSuperAdmin && tenants && tenants.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={effectiveTenantId} 
              onValueChange={setSelectedTenantId}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder={t('users.selectTenant')} />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="glass-tabs">
          <TabsTrigger value="users" className="flex items-center gap-2 rounded-xl">
            <Users className="h-4 w-4" />
            {t('users.usersTab')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 rounded-xl">
            <Shield className="h-4 w-4" />
            {t('users.rolesTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('users.allUsers')}</CardTitle>
                  <CardDescription>
                    {selectedTenant 
                      ? t('users.managingUsersFor', { tenant: selectedTenant.name })
                      : t('users.allUsersDescription')
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('users.searchPlaceholder')}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="ps-9 w-full sm:w-[250px]"
                    />
                  </div>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="me-2 h-4 w-4" />
                    {t('users.inviteUser')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UserTable
                users={users}
                isLoading={usersLoading}
                onEditRoles={handleEditUserRoles}
                onViewDetails={handleViewUserDetails}
                onEdit={handleEditUser}
                onDeactivate={(user) => handleStatusAction(user, 'deactivate')}
                onSuspend={(user) => handleStatusAction(user, 'suspend')}
                onReactivate={(user) => handleStatusAction(user, 'reactivate')}
                onDelete={(user) => handleStatusAction(user, 'delete')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('roles.title')}</CardTitle>
                  <CardDescription>
                    {selectedTenant
                      ? t('roles.managingRolesFor', { tenant: selectedTenant.name })
                      : t('roles.description')
                    }
                  </CardDescription>
                </div>
                <Button onClick={handleCreateRole}>
                  <Plus className="me-2 h-4 w-4" />
                  {t('roles.createRole')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RoleTable
                roles={roles}
                isLoading={rolesLoading}
                onEdit={handleEditRole}
                onManagePermissions={handleManagePermissions}
                onDelete={handleDeleteRole}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserRoleDialog
        open={isUserRoleDialogOpen}
        onOpenChange={setIsUserRoleDialogOpen}
        user={selectedUser}
        tenantId={effectiveTenantId}
      />

      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        onPasswordReset={handlePasswordReset}
        isSaving={updateProfile.isPending}
        isResettingPassword={sendPasswordReset.isPending}
      />

      <UserStatusDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        user={selectedUser}
        action={statusAction}
        onConfirm={handleConfirmStatusChange}
        isLoading={changeUserStatus.isPending}
      />

      <RoleDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        role={selectedRole}
        tenantId={effectiveTenantId}
        onSave={handleSaveRole}
        isSaving={createRole.isPending || updateRole.isPending}
      />

      <PermissionMatrix
        open={isPermissionMatrixOpen}
        onOpenChange={setIsPermissionMatrixOpen}
        role={selectedRole}
      />

      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        tenantId={effectiveTenantId}
      />
    </div>
  );
}
