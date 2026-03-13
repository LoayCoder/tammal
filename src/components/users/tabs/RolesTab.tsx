import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { RoleTable } from '@/components/roles/RoleTable';
import type { Role } from '@/features/auth/hooks/auth/useRoles';

interface RolesTabProps {
  roles: Role[];
  isLoading: boolean;
  selectedTenantName?: string;
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

export function RolesTab({
  roles, isLoading, selectedTenantName,
  onCreateRole, onEditRole, onManagePermissions, onDeleteRole,
}: RolesTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('roles.title')}</CardTitle>
            <CardDescription>
              {selectedTenantName
                ? t('roles.managingRolesFor', { tenant: selectedTenantName })
                : t('roles.description')}
            </CardDescription>
          </div>
          <Button onClick={onCreateRole}>
            <Plus className="me-2 h-4 w-4" />
            {t('roles.createRole')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RoleTable
          roles={roles}
          isLoading={isLoading}
          onEdit={onEditRole}
          onManagePermissions={onManagePermissions}
          onDelete={onDeleteRole}
        />
      </CardContent>
    </Card>
  );
}

