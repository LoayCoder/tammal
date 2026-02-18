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
import { Plus, Search, Users, Shield, UserPlus, Building2, Upload, Download, FolderOpen, Mail } from 'lucide-react';
import { useUnifiedUsers } from '@/hooks/useUnifiedUsers';
import { useUsers, type UserWithRoles } from '@/hooks/useUsers';
import { useRoles, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/hooks/useRoles';
import { useProfile } from '@/hooks/useProfile';
import { useTenants } from '@/hooks/useTenants';
import { useTenantInvitations } from '@/hooks/useTenantInvitations';
import { useHasRole } from '@/hooks/useUserPermissions';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeeSheet } from '@/components/employees/EmployeeSheet';
import { EmployeeImport } from '@/components/employees/EmployeeImport';
import { EmployeeInviteDialog } from '@/components/employees/EmployeeInviteDialog';
import { UserTable } from '@/components/users/UserTable';
import { UserRoleDialog } from '@/components/users/UserRoleDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserStatusDialog, type StatusAction } from '@/components/users/UserStatusDialog';
import { RoleTable } from '@/components/roles/RoleTable';
import { RoleDialog } from '@/components/roles/RoleDialog';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { InvitationManagement } from '@/components/tenants/InvitationManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { type CreateEmployeeInput, type Employee, type EmployeeStatus } from '@/hooks/useEmployees';
import { type AccountStatus } from '@/components/employees/AccountStatusBadge';
import { toast } from 'sonner';

export default function UnifiedUserManagement() {
  const { t, i18n } = useTranslation();

  // Profile & tenant
  const { profile, isLoading: profileLoading } = useProfile();
  const { hasRole: isSuperAdmin } = useHasRole('super_admin');
  const { tenants, isLoading: tenantsLoading } = useTenants();
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(undefined);

  const effectiveTenantId = isSuperAdmin
    ? (selectedTenantId || tenants?.[0]?.id)
    : profile?.tenant_id || undefined;

  useEffect(() => {
    if (isSuperAdmin && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, tenants, selectedTenantId]);

  // Directory state
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>();
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatus>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitingEmployee, setInvitingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Access & Auth state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction>('deactivate');

  // Roles state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);

  // Data hooks
  const {
    unifiedEmployees,
    departments,
    isLoading: employeesLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImport,
  } = useUnifiedUsers({
    tenantId: effectiveTenantId,
    department: departmentFilter,
    status: statusFilter,
    search,
    accountStatusFilter,
  });

  const { createInvitation, isCreating: isCreatingInvitation } = useTenantInvitations(effectiveTenantId || '');

  const { users, isLoading: usersLoading, updateProfile, changeUserStatus, sendPasswordReset } = useUsers({
    tenantId: effectiveTenantId,
    search: userSearch,
  });

  const { roles, isLoading: rolesLoading, createRole, updateRole, deleteRole } = useRoles(effectiveTenantId);

  const selectedTenant = tenants?.find(t => t.id === effectiveTenantId);

  // Directory handlers
  const handleSubmit = (data: CreateEmployeeInput) => {
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...data }, {
        onSuccess: () => { setSheetOpen(false); setEditingEmployee(null); }
      });
    } else {
      createEmployee.mutate(data, { onSuccess: () => setSheetOpen(false) });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setSheetOpen(true);
  };

  const handleInvite = (employee: Employee) => {
    if (employee.user_id) {
      toast.error(t('employees.alreadyHasAccount'));
      return;
    }
    setInvitingEmployee(employee);
    setInviteOpen(true);
  };

  const handleSendInvite = (employeeId: string, email: string, fullName: string, expiryDays: number) => {
    createInvitation({
      email,
      full_name: fullName,
      tenant_id: effectiveTenantId!,
      employee_id: employeeId,
      expiry_days: expiryDays,
    }, {
      onSuccess: () => {
        setInviteOpen(false);
        setInvitingEmployee(null);
        toast.success(t('employees.inviteSuccess'));
      }
    });
  };

  const handleExportCSV = () => {
    if (unifiedEmployees.length === 0) {
      toast.error(t('employees.noDataToExport'));
      return;
    }
    const headers = ['Name', 'Email', 'Employee Number', 'Department', 'Role', 'Hire Date', 'Status', 'Account Status'];
    const rows = unifiedEmployees.map(emp => [
      emp.full_name, emp.email, emp.employee_number || '', emp.department || '',
      emp.role_title || '', emp.hire_date || '', emp.status, emp.accountStatus,
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `directory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('employees.exportSuccess'));
  };

  // Access & Auth handlers
  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleEditUserRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsUserRoleDialogOpen(true);
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
      deactivate: 'inactive', suspend: 'suspended', reactivate: 'active', delete: 'inactive',
    };
    await changeUserStatus.mutateAsync({ id: selectedUser.id, status: statusMap[statusAction] });
    setIsStatusDialogOpen(false);
  };

  // Roles handlers
  const handleCreateRole = () => { setSelectedRole(null); setIsRoleDialogOpen(true); };
  const handleEditRole = (role: Role) => { setSelectedRole(role); setIsRoleDialogOpen(true); };
  const handleManagePermissions = (role: Role) => { setSelectedRole(role); setIsPermissionMatrixOpen(true); };

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

  // Loading states
  if (profileLoading || (isSuperAdmin && tenantsLoading)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('userManagement.title')}</h1>
          <p className="text-muted-foreground">{t('userManagement.subtitle')}</p>
        </div>

        {isSuperAdmin && tenants && tenants.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select value={effectiveTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder={t('users.selectTenant')} />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('userManagement.directoryTab')}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('userManagement.accessTab')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('userManagement.rolesTab')}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('userManagement.invitationsTab')}
          </TabsTrigger>
        </TabsList>

        {/* Directory Tab */}
        <TabsContent value="directory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('employees.directory')}</CardTitle>
                  <CardDescription>
                    {selectedTenant
                      ? t('users.managingUsersFor', { tenant: selectedTenant.name })
                      : t('employees.directoryDescription')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                    <Upload className="h-4 w-4 me-2" />
                    {t('employees.import')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 me-2" />
                    {t('employees.export')}
                  </Button>
                  <Button size="sm" onClick={() => { setEditingEmployee(null); setSheetOpen(true); }}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('employees.addEmployee')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('employees.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ps-9"
                  />
                </div>
                <Select value={departmentFilter || 'all'} onValueChange={(v) => setDepartmentFilter(v === 'all' ? undefined : v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('employees.allDepartments')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('employees.allDepartments')}</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v as EmployeeStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('employees.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('employees.allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('employees.status.active')}</SelectItem>
                    <SelectItem value="resigned">{t('employees.status.resigned')}</SelectItem>
                    <SelectItem value="terminated">{t('employees.status.terminated')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={accountStatusFilter || 'all'} onValueChange={(v) => setAccountStatusFilter(v === 'all' ? undefined : v as AccountStatus)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('userManagement.filterByAccountStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="not_invited">{t('userManagement.notInvited')}</SelectItem>
                    <SelectItem value="invited">{t('userManagement.invitationSent')}</SelectItem>
                    <SelectItem value="active">{t('userManagement.activeUser')}</SelectItem>
                    <SelectItem value="suspended">{t('userManagement.suspendedUser')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <EmployeeTable
                employees={unifiedEmployees}
                onEdit={handleEdit}
                onDelete={(id) => deleteEmployee.mutate(id)}
                onInvite={handleInvite}
                showAccountStatus
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access & Auth Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('userManagement.accessTab')}</CardTitle>
                  <CardDescription>
                    {selectedTenant
                      ? t('users.managingUsersFor', { tenant: selectedTenant.name })
                      : t('users.allUsersDescription')}
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('users.searchPlaceholder')}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="ps-9 w-full sm:w-[250px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UserTable
                users={users}
                isLoading={usersLoading}
                onEditRoles={handleEditUserRoles}
                onViewDetails={handleEditUser}
                onEdit={handleEditUser}
                onDeactivate={(user) => handleStatusAction(user, 'deactivate')}
                onSuspend={(user) => handleStatusAction(user, 'suspend')}
                onReactivate={(user) => handleStatusAction(user, 'reactivate')}
                onDelete={(user) => handleStatusAction(user, 'delete')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('roles.title')}</CardTitle>
                  <CardDescription>
                    {selectedTenant
                      ? t('roles.managingRolesFor', { tenant: selectedTenant.name })
                      : t('roles.description')}
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

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <InvitationManagement tenantId={effectiveTenantId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={editingEmployee}
        employees={unifiedEmployees}
        tenantId={effectiveTenantId}
        departments={departments}
        onSubmit={handleSubmit}
        isLoading={createEmployee.isPending || updateEmployee.isPending}
      />

      <EmployeeImport
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={effectiveTenantId}
        onImport={(data) => bulkImport.mutate(data)}
        isLoading={bulkImport.isPending}
      />

      <EmployeeInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        employee={invitingEmployee}
        onSendInvite={handleSendInvite}
        isLoading={isCreatingInvitation}
      />

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
    </div>
  );
}
