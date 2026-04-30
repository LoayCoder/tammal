import { useEffect, useState } from 'react';
import type { UserWithRoles } from '@/hooks/org/useUsers';
import type { Role } from '@/hooks/auth/useRoles';
import type { Employee } from '@/hooks/org/useEmployees';
import type { StatusAction } from '@/components/users/UserStatusDialog';
import { useUiStore } from '@/stores/uiStore';

interface UseUnifiedUserManagementStateParams {
  isSuperAdmin: boolean;
  tenants: Array<{ id: string }> | undefined;
  profileTenantId: string | null | undefined;
}

export function useUnifiedUserManagementState({
  isSuperAdmin,
  tenants,
  profileTenantId,
}: UseUnifiedUserManagementStateParams) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(undefined);

  const effectiveTenantId = isSuperAdmin
    ? selectedTenantId || tenants?.[0]?.id
    : profileTenantId || undefined;

  useEffect(() => {
    if (isSuperAdmin && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, tenants, selectedTenantId]);

  const search = useUiStore((state) => state.directorySearch);
  const setSearch = useUiStore((state) => state.setDirectorySearch);
  const departmentFilter = useUiStore((state) => state.directoryDepartmentFilter);
  const setDepartmentFilter = useUiStore((state) => state.setDirectoryDepartmentFilter);
  const statusFilter = useUiStore((state) => state.directoryStatusFilter);
  const setStatusFilter = useUiStore((state) => state.setDirectoryStatusFilter);
  const accountStatusFilter = useUiStore((state) => state.directoryAccountStatusFilter);
  const setAccountStatusFilter = useUiStore((state) => state.setDirectoryAccountStatusFilter);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitingEmployee, setInvitingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const userSearch = useUiStore((state) => state.accessUserSearch);
  const setUserSearch = useUiStore((state) => state.setAccessUserSearch);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction>('deactivate');

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);

  return {
    selectedTenantId,
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
  };
}