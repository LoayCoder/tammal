import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FolderOpen, Users, Shield, Mail, UserCheck, Search, Filter, Plus, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RepresentativeTab } from '@/components/users/RepresentativeTab';
import { useUnifiedUsers } from '@/hooks/org/useUnifiedUsers';
import { useUsers, type UserWithRoles } from '@/hooks/org/useUsers';
import { useRoles, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/hooks/auth/useRoles';
import { useProfile } from '@/hooks/auth/useProfile';
import { useTenants } from '@/hooks/org/useTenants';
import { useTenantInvitations } from '@/hooks/org/useTenantInvitations';
import { useHasRole } from '@/hooks/auth/useUserPermissions';
import { EmployeeSheet } from '@/components/employees/EmployeeSheet';
import { EmployeeImport } from '@/components/employees/EmployeeImport';
import { EmployeeInviteDialog } from '@/components/employees/EmployeeInviteDialog';
import { UserRoleDialog } from '@/components/users/UserRoleDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserStatusDialog, type StatusAction } from '@/components/users/UserStatusDialog';
import { RoleDialog } from '@/components/roles/RoleDialog';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { InvitationManagement } from '@/components/tenants/InvitationManagement';
import { DirectoryTab } from '@/components/users/tabs/DirectoryTab';
import { AccessTab } from '@/components/users/tabs/AccessTab';
import { RolesTab } from '@/components/users/tabs/RolesTab';
import { type CreateEmployeeInput, type Employee } from '@/hooks/org/useEmployees';
import { toast } from 'sonner';
import { useUnifiedUserManagementState } from '@/hooks/admin/useUnifiedUserManagementState';
import { cardVariants, layout, typography } from '@/theme/tokens';

export default function UnifiedUserManagement() {
  const { t } = useTranslation();

  const { profile, isPending: profileLoading } = useProfile();
  const { hasRole: isSuperAdmin } = useHasRole('super_admin');
  const { tenants, isPending: tenantsLoading } = useTenants();
  const {
    setSelectedTenantId,
    effectiveTenantId,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    accountStatusFilter,
    setAccountStatusFilter,
    sheetOpen,
    setSheetOpen,
    importOpen,
    setImportOpen,
    inviteOpen,
    setInviteOpen,
    invitingEmployee,
    setInvitingEmployee,
    editingEmployee,
    setEditingEmployee,
    userSearch,
    setUserSearch,
    selectedUser,
    setSelectedUser,
    isUserRoleDialogOpen,
    setIsUserRoleDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isStatusDialogOpen,
    setIsStatusDialogOpen,
    statusAction,
    setStatusAction,
    selectedRole,
    setSelectedRole,
    isRoleDialogOpen,
    setIsRoleDialogOpen,
    isPermissionMatrixOpen,
    setIsPermissionMatrixOpen,
  } = useUnifiedUserManagementState({
    isSuperAdmin,
    tenants,
    profileTenantId: profile?.tenant_id,
  });

  // Data hooks
  const { unifiedEmployees, departments, isPending: employeesLoading, createEmployee, updateEmployee, deleteEmployee, bulkImport } = useUnifiedUsers({
    tenantId: effectiveTenantId, department: departmentFilter, status: statusFilter, search, accountStatusFilter,
  });
  const { createInvitation, isCreating: isCreatingInvitation } = useTenantInvitations(effectiveTenantId || '');
  const { users, isPending: usersLoading, updateProfile, changeUserStatus, sendPasswordReset } = useUsers({ tenantId: effectiveTenantId, search: userSearch });
  const { roles, isPending: rolesLoading, createRole, updateRole, deleteRole } = useRoles(effectiveTenantId);

  const selectedTenant = tenants?.find(t => t.id === effectiveTenantId);

  // Handlers
  const handleSubmit = (data: CreateEmployeeInput) => {
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...data }, { onSuccess: () => { setSheetOpen(false); setEditingEmployee(null); } });
    } else {
      createEmployee.mutate(data, { onSuccess: () => setSheetOpen(false) });
    }
  };

  const handleEdit = (employee: Employee) => { setEditingEmployee(employee); setSheetOpen(true); };

  const handleInvite = (employee: Employee) => {
    if (employee.user_id) { toast.error(t('employees.alreadyHasAccount')); return; }
    setInvitingEmployee(employee); setInviteOpen(true);
  };

  const handleSendInvite = (employeeId: string, email: string, fullName: string, expiryDays: number) => {
    createInvitation({ email, full_name: fullName, tenant_id: effectiveTenantId!, employee_id: employeeId, expiry_days: expiryDays }, {
      onSuccess: () => { setInviteOpen(false); setInvitingEmployee(null); toast.success(t('employees.inviteSuccess')); }
    });
  };

  const handleExportCSV = () => {
    if (unifiedEmployees.length === 0) { toast.error(t('employees.noDataToExport')); return; }
    const headers = ['Name', 'Email', 'Employee Number', 'Department', 'Role', 'Hire Date', 'Status', 'Account Status'];
    const rows = unifiedEmployees.map(emp => [emp.full_name, emp.email, emp.employee_number || '', emp.department || '', emp.role_title || '', emp.hire_date || '', emp.status, emp.accountStatus]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `directory-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success(t('employees.exportSuccess'));
  };

  const handleEditUser = (user: UserWithRoles) => { setSelectedUser(user); setIsEditDialogOpen(true); };
  const handleEditUserRoles = (user: UserWithRoles) => { setSelectedUser(user); setIsUserRoleDialogOpen(true); };
  const handleStatusAction = (user: UserWithRoles, action: StatusAction) => { setSelectedUser(user); setStatusAction(action); setIsStatusDialogOpen(true); };

  const handleSaveUser = async (userId: string, data: { full_name?: string; status?: string; job_title?: string; department?: string; phone?: string; location?: string; avatar_url?: string | null }) => {
    await updateProfile.mutateAsync({ id: userId, ...data });
  };

  const handlePasswordReset = async (userId: string, email: string) => { await sendPasswordReset.mutateAsync({ userId, email }); };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser) return;
    const statusMap: Record<StatusAction, 'active' | 'inactive' | 'suspended'> = { deactivate: 'inactive', suspend: 'suspended', reactivate: 'active', delete: 'inactive' };
    await changeUserStatus.mutateAsync({ id: selectedUser.id, status: statusMap[statusAction] });
    setIsStatusDialogOpen(false);
  };

  const handleCreateRole = () => { setSelectedRole(null); setIsRoleDialogOpen(true); };
  const handleEditRole = (role: Role) => { setSelectedRole(role); setIsRoleDialogOpen(true); };
  const handleManagePermissions = (role: Role) => { setSelectedRole(role); setIsPermissionMatrixOpen(true); };

  const handleSaveRole = async (data: CreateRoleInput | UpdateRoleInput) => {
    if ('id' in data) await updateRole.mutateAsync(data);
    else await createRole.mutateAsync(data);
    setIsRoleDialogOpen(false);
  };

  const handleDeleteRole = async (roleId: string) => { await deleteRole.mutateAsync(roleId); };

  if (profileLoading || (isSuperAdmin && tenantsLoading)) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
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

  const statCards = [
    { label: 'Employees', value: unifiedEmployees.length, icon: FolderOpen, tone: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]' },
    { label: 'Accounts', value: users.length, icon: Users, tone: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]' },
    { label: 'Roles', value: roles.length, icon: Shield, tone: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)]' },
  ];

  return (
    <div className="space-y-6">
      <div className={layout.dashboardGrid}>
        <Card className={cardVariants.elevated + " xl:col-span-8"}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge className="premium-badge w-fit gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  <Sparkles className="h-3 w-3" />
                  Enterprise admin console
                </Badge>
                <div>
                  <h1 className={typography.pageTitle}>{t('userManagement.title')}</h1>
                  <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">{t('userManagement.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.slice(0, 4).map((role) => (
                    <Badge key={role.id} variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {isSuperAdmin && tenants && tenants.length > 0 && (
                <div className="w-full max-w-sm space-y-2">
                  <p className={typography.statLabel}>Tenant scope</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                    <Select value={effectiveTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger className="w-full rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        <SelectValue placeholder={t('users.selectTenant')} />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(tenant => <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 xl:col-span-4 xl:grid-cols-1">
          {statCards.map((item) => (
            <Card key={item.label} className={cardVariants.surface}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className={typography.statLabel}>{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className={cardVariants.surface}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
                {search || userSearch || t('common.search')}
              </div>
              {[departmentFilter, statusFilter, accountStatusFilter].filter(Boolean).map((filterValue) => (
                <Badge key={filterValue} variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                  <Filter className="me-1 h-3 w-3" />
                  {String(filterValue)}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]" onClick={() => setImportOpen(true)}>
                {t('employees.import')}
              </Button>
              <Button variant="outline" className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]" onClick={() => setSelectedRole(null)}>
                {t('userManagement.rolesTab')}
              </Button>
              <Button className="rounded-xl bg-[var(--brand-primary)] text-slate-950 hover:bg-[var(--brand-primary-hover)]" onClick={() => { setEditingEmployee(null); setSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" />
                {t('employees.addEmployee')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList className="glass-tabs">
          <TabsTrigger value="directory" className="flex items-center gap-2 rounded-xl"><FolderOpen className="h-4 w-4" />{t('userManagement.directoryTab')}</TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2 rounded-xl"><Users className="h-4 w-4" />{t('userManagement.accessTab')}</TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 rounded-xl"><Shield className="h-4 w-4" />{t('userManagement.rolesTab')}</TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2 rounded-xl"><Mail className="h-4 w-4" />{t('userManagement.invitationsTab')}</TabsTrigger>
          <TabsTrigger value="representatives" className="flex items-center gap-2 rounded-xl"><UserCheck className="h-4 w-4" />{t('userManagement.representativesTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          <DirectoryTab
            employees={unifiedEmployees} departments={departments} selectedTenantName={selectedTenant?.name}
            search={search} onSearchChange={setSearch}
            departmentFilter={departmentFilter} onDepartmentChange={setDepartmentFilter}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            accountStatusFilter={accountStatusFilter} onAccountStatusChange={setAccountStatusFilter}
            onEdit={handleEdit} onDelete={(id) => deleteEmployee.mutate(id)} onInvite={handleInvite}
            onImport={() => setImportOpen(true)} onExport={handleExportCSV}
            onAdd={() => { setEditingEmployee(null); setSheetOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <AccessTab
            users={users} isLoading={usersLoading} selectedTenantName={selectedTenant?.name}
            search={userSearch} onSearchChange={setUserSearch}
            onEditRoles={handleEditUserRoles} onViewDetails={handleEditUser}
            onDeactivate={(u) => handleStatusAction(u, 'deactivate')} onSuspend={(u) => handleStatusAction(u, 'suspend')}
            onReactivate={(u) => handleStatusAction(u, 'reactivate')} onDelete={(u) => handleStatusAction(u, 'delete')}
          />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RolesTab
            roles={roles} isLoading={rolesLoading} selectedTenantName={selectedTenant?.name}
            onCreateRole={handleCreateRole} onEditRole={handleEditRole}
            onManagePermissions={handleManagePermissions} onDeleteRole={handleDeleteRole}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <InvitationManagement tenantId={effectiveTenantId} />
        </TabsContent>

        <TabsContent value="representatives" className="space-y-4">
          <RepresentativeTab tenantId={effectiveTenantId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EmployeeSheet open={sheetOpen} onOpenChange={setSheetOpen} employee={editingEmployee} employees={unifiedEmployees} tenantId={effectiveTenantId} departments={departments} onSubmit={handleSubmit} isLoading={createEmployee.isPending || updateEmployee.isPending} />
      <EmployeeImport open={importOpen} onOpenChange={setImportOpen} tenantId={effectiveTenantId} onImport={(data) => bulkImport.mutate(data)} isLoading={bulkImport.isPending} />
      <EmployeeInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} employee={invitingEmployee} onSendInvite={handleSendInvite} isLoading={isCreatingInvitation} />
      <UserRoleDialog open={isUserRoleDialogOpen} onOpenChange={setIsUserRoleDialogOpen} user={selectedUser} tenantId={effectiveTenantId} />
      <UserEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} user={selectedUser} onSave={handleSaveUser} onPasswordReset={handlePasswordReset} isSaving={updateProfile.isPending} isResettingPassword={sendPasswordReset.isPending} />
      <UserStatusDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen} user={selectedUser} action={statusAction} onConfirm={handleConfirmStatusChange} isLoading={changeUserStatus.isPending} />
      <RoleDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen} role={selectedRole} tenantId={effectiveTenantId} onSave={handleSaveRole} isSaving={createRole.isPending || updateRole.isPending} />
      <PermissionMatrix open={isPermissionMatrixOpen} onOpenChange={setIsPermissionMatrixOpen} role={selectedRole} />
    </div>
  );
}
