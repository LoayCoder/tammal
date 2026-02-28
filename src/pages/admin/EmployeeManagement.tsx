import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeSheet } from "@/components/employees/EmployeeSheet";
import { EmployeeImport } from "@/components/employees/EmployeeImport";
import { EmployeeInviteDialog } from "@/components/employees/EmployeeInviteDialog";
import { useEmployees, CreateEmployeeInput, Employee, EmployeeStatus } from "@/hooks/org/useEmployees";
import { useTenants } from "@/hooks/org/useTenants";
import { useTenantInvitations } from "@/hooks/org/useTenantInvitations";
import { Plus, Search, Upload, Download, Users } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitingEmployee, setInvitingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { tenants } = useTenants();
  const tenantId = tenants[0]?.id || '';
  
  const { employees, departments, isLoading, createEmployee, updateEmployee, deleteEmployee, bulkImport } = useEmployees({
    department: departmentFilter,
    status: statusFilter,
    search,
  });

  const { createInvitation, isCreating: isCreatingInvitation } = useTenantInvitations(tenantId);

  const handleSubmit = (data: CreateEmployeeInput) => {
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...data }, {
        onSuccess: () => {
          setSheetOpen(false);
          setEditingEmployee(null);
        }
      });
    } else {
      createEmployee.mutate(data, {
        onSuccess: () => setSheetOpen(false)
      });
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
      tenant_id: tenantId,
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
    if (employees.length === 0) {
      toast.error(t('employees.noDataToExport'));
      return;
    }

    const headers = ['Name', 'Email', 'Employee Number', 'Department', 'Role', 'Hire Date', 'Status'];
    const rows = employees.map(emp => [
      emp.full_name,
      emp.email,
      emp.employee_number || '',
      emp.department || '',
      emp.role_title || '',
      emp.hire_date || '',
      emp.status,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('employees.exportSuccess'));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Users className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('employees.title')}</h1>
            <p className="text-muted-foreground">{t('employees.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 me-2" />
            {t('employees.import')}
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 me-2" />
            {t('employees.export')}
          </Button>
          <Button onClick={() => { setEditingEmployee(null); setSheetOpen(true); }}>
            <Plus className="h-4 w-4 me-2" />
            {t('employees.addEmployee')}
          </Button>
        </div>
      </div>

      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle>{t('employees.directory')}</CardTitle>
          <CardDescription>{t('employees.directoryDescription')}</CardDescription>
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
          </div>

          <EmployeeTable
            employees={employees}
            onEdit={handleEdit}
            onDelete={(id) => deleteEmployee.mutate(id)}
            onInvite={handleInvite}
          />
        </CardContent>
      </Card>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={editingEmployee}
        employees={employees}
        tenantId={tenantId}
        departments={departments}
        onSubmit={handleSubmit}
        isLoading={createEmployee.isPending || updateEmployee.isPending}
      />

      <EmployeeImport
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={tenantId}
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
    </div>
  );
}
