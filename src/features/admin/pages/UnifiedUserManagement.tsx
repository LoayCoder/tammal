import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Building2, FolderOpen, Users, Shield, Mail, UserCheck } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RepresentativeTab } from '@/components/users/RepresentativeTab';
import { useUnifiedUsers } from '@/hooks/org/useUnifiedUsers';
import { useUsers, type UserWithRoles } from '@/hooks/org/useUsers';
import { useRoles, type Role, type CreateRoleInput, type UpdateRoleInput } from '@/features/auth/hooks/auth/useRoles';
import { useProfile } from '@/features/auth/hooks/auth/useProfile';
import { useTenants } from '@/hooks/org/useTenants';
import { useTenantInvitations } from '@/hooks/org/useTenantInvitations';
import { useHasRole } from '@/features/auth/hooks/auth/useUserPermissions';
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
import { type CreateEmployeeInput, type Employee, type EmployeeStatus } from '@/hooks/org/useEmployees';
import { type AccountStatus } from '@/components/employees/AccountStatusBadge';
import { toast } from 'sonner';

export default function UnifiedUserManagement() {
  const { t } = useTranslation();

  const { profile, isPending: profileLoading } = useProfile();
  const { hasRole: isSuperAdmin } = useHasRole('super_admin');
  const { tenants, isPending: tenantsLoading } = useTenants();
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(undefined);

  const effectiveTenantId = isSuperAdmin ? (selectedTenantId || tenants?.[0]?.id) : profile?.tenant_id || undefined;

  useEffect(() => {
    if (isSuperAdmin && tenants && tenants.length > 0 && !selectedTenantId) setSelectedTenantId(tenants[0].id);
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

  // Access state
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('userManagement.title')}</h1>
          <p className="text-muted-foreground">{t('userManagement.subtitle')}</p>
        </div>
        {isSuperAdmin && tenants && tenants.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select value={effectiveTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder={t('users.selectTenant')} /></SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

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

