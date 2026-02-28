import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Key, Trash2, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DataTable } from '@/shared/data-table/DataTable';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';
import type { ColumnDef } from '@/shared/data-table/types';
import type { Role } from '@/hooks/auth/useRoles';
import { useState } from 'react';

interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
  onEdit: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDelete: (roleId: string) => void;
}

export function RoleTable({ roles, isLoading, onEdit, onManagePermissions, onDelete }: RoleTableProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const getBaseRoleLabel = (baseRole: string) => {
    const roleLabels: Record<string, string> = {
      'user': t('roles.baseRoles.user'),
      'manager': t('roles.baseRoles.manager'),
      'tenant_admin': t('roles.baseRoles.tenantAdmin'),
      'super_admin': t('roles.baseRoles.superAdmin'),
    };
    return roleLabels[baseRole] || baseRole;
  };

  const columns: ColumnDef<Role>[] = [
    {
      id: 'name',
      header: t('roles.name'),
      cell: (role) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: role.color }}
          />
          <span className="font-medium">
            {isRTL && role.name_ar ? role.name_ar : role.name}
          </span>
          {role.is_system_role && (
            <Badge variant="secondary" className="text-xs">
              {t('roles.system')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'description',
      header: t('roles.description'),
      cell: (role) => (
        <span className="text-muted-foreground max-w-[300px] truncate block">
          {isRTL && role.description_ar ? role.description_ar : role.description || '-'}
        </span>
      ),
    },
    {
      id: 'base_role',
      header: t('roles.baseRole'),
      cell: (role) => (
        <Badge variant="outline">{getBaseRoleLabel(role.base_role || '')}</Badge>
      ),
    },
    {
      id: 'created_at',
      header: t('roles.createdAt'),
      cell: (role) => (
        <span className="text-muted-foreground">
          {formatDate(role.created_at, i18n.language)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      headerHidden: true,
      className: 'w-[70px]',
      cell: (role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <Edit className="me-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManagePermissions(role)}>
              <Key className="me-2 h-4 w-4" />
              {t('roles.managePermissions')}
            </DropdownMenuItem>
            {!role.is_system_role && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteRole(role)}
                  className="text-destructive"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={roles}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyIcon={<Shield className="h-12 w-12 text-muted-foreground" />}
        emptyMessage={t('roles.noRoles')}
        emptyDescription={t('roles.noRolesDescription')}
        bordered={false}
      />

      <ConfirmDialog
        open={!!deleteRole}
        onOpenChange={() => setDeleteRole(null)}
        title={t('roles.deleteTitle')}
        description={t('roles.deleteDescription', { name: deleteRole?.name })}
        onConfirm={() => {
          if (deleteRole) {
            onDelete(deleteRole.id);
            setDeleteRole(null);
          }
        }}
      />
    </>
  );
}
