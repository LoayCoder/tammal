import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Search, Upload, Download } from 'lucide-react';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import type { Employee, EmployeeStatus } from '@/hooks/org/useEmployees';
import type { AccountStatus } from '@/components/employees/AccountStatusBadge';

interface UnifiedEmployee extends Employee {
  accountStatus: AccountStatus;
}

interface DirectoryTabProps {
  employees: UnifiedEmployee[];
  departments: string[];
  selectedTenantName?: string;
  search: string;
  onSearchChange: (value: string) => void;
  departmentFilter?: string;
  onDepartmentChange: (value: string | undefined) => void;
  statusFilter?: EmployeeStatus;
  onStatusChange: (value: EmployeeStatus | undefined) => void;
  accountStatusFilter?: AccountStatus;
  onAccountStatusChange: (value: AccountStatus | undefined) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onInvite: (employee: Employee) => void;
  onImport: () => void;
  onExport: () => void;
  onAdd: () => void;
}

export function DirectoryTab({
  employees, departments, selectedTenantName,
  search, onSearchChange, departmentFilter, onDepartmentChange,
  statusFilter, onStatusChange, accountStatusFilter, onAccountStatusChange,
  onEdit, onDelete, onInvite, onImport, onExport, onAdd,
}: DirectoryTabProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('employees.directory')}</CardTitle>
            <CardDescription>
              {selectedTenantName
                ? t('users.managingUsersFor', { tenant: selectedTenantName })
                : t('employees.directoryDescription')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 me-2" />{t('employees.import')}
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 me-2" />{t('employees.export')}
            </Button>
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 me-2" />{t('employees.addEmployee')}
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={departmentFilter || 'all'} onValueChange={(v) => onDepartmentChange(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t('employees.allDepartments')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('employees.allDepartments')}</SelectItem>
              {departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? undefined : v as EmployeeStatus)}>
            <SelectTrigger className="w-32"><SelectValue placeholder={t('employees.allStatuses')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('employees.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('employees.status.active')}</SelectItem>
              <SelectItem value="resigned">{t('employees.status.resigned')}</SelectItem>
              <SelectItem value="terminated">{t('employees.status.terminated')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountStatusFilter || 'all'} onValueChange={(v) => onAccountStatusChange(v === 'all' ? undefined : v as AccountStatus)}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t('userManagement.filterByAccountStatus')} /></SelectTrigger>
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
          employees={employees}
          onEdit={onEdit}
          onDelete={onDelete}
          onInvite={onInvite}
          showAccountStatus
        />
      </CardContent>
    </Card>
  );
}
