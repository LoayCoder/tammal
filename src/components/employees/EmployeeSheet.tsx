import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerSelect } from "./ManagerSelect";
import { Employee, CreateEmployeeInput, EmployeeStatus } from "@/hooks/useEmployees";

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
  departments,
  onSubmit,
  isLoading,
}: EmployeeSheetProps) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>();
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("active");

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name);
      setEmail(employee.email);
      setEmployeeNumber(employee.employee_number || "");
      setDepartment(employee.department || "");
      setRoleTitle(employee.role_title || "");
      setManagerId(employee.manager_id || undefined);
      setHireDate(employee.hire_date || "");
      setStatus(employee.status);
    } else {
      setFullName("");
      setEmail("");
      setEmployeeNumber("");
      setDepartment("");
      setRoleTitle("");
      setManagerId(undefined);
      setHireDate("");
      setStatus("active");
    }
  }, [employee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tenant_id: tenantId,
      full_name: fullName,
      email,
      employee_number: employeeNumber || undefined,
      department: department || undefined,
      role_title: roleTitle || undefined,
      manager_id: managerId,
      hire_date: hireDate || undefined,
      status,
    });
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

          <div className="space-y-2">
            <Label htmlFor="department">{t('employees.department')}</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              list="departments"
            />
            <datalist id="departments">
              {departments.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
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
