import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { UserTable } from '@/components/users/UserTable';
import type { UserWithRoles } from '@/hooks/org/useUsers';
import type { StatusAction } from '@/components/users/UserStatusDialog';

interface AccessTabProps {
  users: UserWithRoles[];
  isLoading: boolean;
  selectedTenantName?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onEditRoles: (user: UserWithRoles) => void;
  onViewDetails: (user: UserWithRoles) => void;
  onDeactivate: (user: UserWithRoles) => void;
  onSuspend: (user: UserWithRoles) => void;
  onReactivate: (user: UserWithRoles) => void;
  onDelete: (user: UserWithRoles) => void;
}

export function AccessTab({
  users, isLoading, selectedTenantName,
  search, onSearchChange,
  onEditRoles, onViewDetails,
  onDeactivate, onSuspend, onReactivate, onDelete,
}: AccessTabProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('userManagement.accessTab')}</CardTitle>
            <CardDescription>
              {selectedTenantName
                ? t('users.managingUsersFor', { tenant: selectedTenantName })
                : t('users.allUsersDescription')}
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ps-9 w-full sm:w-[250px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UserTable
          users={users}
          isLoading={isLoading}
          onEditRoles={onEditRoles}
          onViewDetails={onViewDetails}
          onEdit={onViewDetails}
          onDeactivate={onDeactivate}
          onSuspend={onSuspend}
          onReactivate={onReactivate}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
