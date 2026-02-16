import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerSelect } from "./ManagerSelect";
import { Employee, CreateEmployeeInput, EmployeeStatus } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useBranches } from "@/hooks/useBranches";

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  employees: Employee[];
  tenantId: string;
  departments: string[];
  onSubmit: (data: CreateEmployeeInput) => void;
  isLoading?: boolean;
}

export function EmployeeSheet({
  open,
  onOpenChange,
  employee,
  employees,
  tenantId,
  onSubmit,
  isLoading,
}: EmployeeSheetProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { departments: deptList } = useDepartments();
  const { branches } = useBranches();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [roleTitle, setRoleTitle] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>();
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("active");

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name);
      setEmail(employee.email);
      setEmployeeNumber(employee.employee_number || "");
      setDepartmentId((employee as any).department_id || undefined);
      setBranchId((employee as any).branch_id || undefined);
      setRoleTitle(employee.role_title || "");
      setManagerId(employee.manager_id || undefined);
      setHireDate(employee.hire_date || "");
      setStatus(employee.status);
    } else {
      setFullName("");
      setEmail("");
      setEmployeeNumber("");
      setDepartmentId(undefined);
      setBranchId(undefined);
      setRoleTitle("");
      setManagerId(undefined);
      setHireDate("");
      setStatus("active");
    }
  }, [employee, open]);

  // Filter departments by selected branch
  const filteredDepts = branchId
    ? deptList.filter(d => d.branch_id === branchId)
    : deptList;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Find department name for backward compat with text field
    const selectedDept = deptList.find(d => d.id === departmentId);
    onSubmit({
      tenant_id: tenantId,
      full_name: fullName,
      email,
      employee_number: employeeNumber || undefined,
      department: selectedDept?.name || undefined,
      role_title: roleTitle || undefined,
      manager_id: managerId,
      hire_date: hireDate || undefined,
      status,
    } as any);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {employee ? t('employees.editEmployee') : t('employees.addEmployee')}
          </SheetTitle>
          <SheetDescription>
            {employee ? t('employees.editEmployeeDescription') : t('employees.addEmployeeDescription')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('employees.name')} *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('employees.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeNumber">{t('employees.employeeNumber')}</Label>
            <Input
              id="employeeNumber"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
            />
          </div>

          {/* Division Dropdown */}
          <div className="space-y-2">
            <Label>{t('organization.division')}</Label>
            <Select
              value={branchId || "none"}
              onValueChange={(val) => {
                setBranchId(val === "none" ? undefined : val);
                // Reset department when division changes
                setDepartmentId(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('organization.selectDivision')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {branches.filter(b => b.is_active !== false).map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {isAr && branch.name_ar ? branch.name_ar : branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Dropdown */}
          <div className="space-y-2">
            <Label>{t('employees.department')}</Label>
            <Select
              value={departmentId || "none"}
              onValueChange={(val) => setDepartmentId(val === "none" ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('organization.selectDepartment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {filteredDepts.filter(d => d.is_active !== false).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {isAr && dept.name_ar ? dept.name_ar : dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleTitle">{t('employees.role')}</Label>
            <Input
              id="roleTitle"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('employees.manager')}</Label>
            <ManagerSelect
              employees={employees}
              value={managerId}
              onChange={setManagerId}
              excludeId={employee?.id}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">{t('employees.hireDate')}</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as EmployeeStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('employees.status.active')}</SelectItem>
                <SelectItem value="resigned">{t('employees.status.resigned')}</SelectItem>
                <SelectItem value="terminated">{t('employees.status.terminated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !fullName.trim() || !email.trim()}>
              {employee ? t('common.save') : t('common.create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
