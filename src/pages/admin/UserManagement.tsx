import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, Shield, UserPlus } from 'lucide-react';
import { useUsers, type UserWithRoles } from '@/hooks/useUsers';
import { useRoles, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/hooks/useRoles';
import { useAuth } from '@/hooks/useAuth';
import { UserTable } from '@/components/users/UserTable';
import { UserRoleDialog } from '@/components/users/UserRoleDialog';
import { RoleTable } from '@/components/roles/RoleTable';
import { RoleDialog } from '@/components/roles/RoleDialog';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';

export default function UserManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // For now, we'll use a placeholder tenant ID. In production, this would come from user context.
  const tenantId = 'placeholder-tenant-id';
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);
  
  const { users, isLoading: usersLoading } = useUsers({ search: userSearch });
  const { roles, isLoading: rolesLoading, createRole, updateRole, deleteRole } = useRoles();

  const handleEditUserRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsUserRoleDialogOpen(true);
  };

  const handleViewUserDetails = (user: UserWithRoles) => {
    // For now, just open role dialog. Could expand to full user sheet.
    handleEditUserRoles(user);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('users.usersTab')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('users.rolesTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('users.allUsers')}</CardTitle>
                  <CardDescription>{t('users.allUsersDescription')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('users.searchPlaceholder')}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="ps-9 w-[250px]"
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
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('roles.title')}</CardTitle>
                  <CardDescription>{t('roles.description')}</CardDescription>
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
        tenantId={tenantId}
      />

      <RoleDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        role={selectedRole}
        tenantId={tenantId}
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
        tenantId={tenantId}
      />
    </div>
  );
}
