import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagerSelect } from "./ManagerSelect";
import { Employee, CreateEmployeeInput, EmployeeStatus } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useBranches } from "@/hooks/useBranches";
import { useDivisions } from "@/hooks/useDivisions";
import { useSites } from "@/hooks/useSites";
import { supabase } from "@/integrations/supabase/client";

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
  const { divisions } = useDivisions();
  const { sites: sections } = useSites();

  // Fetch user IDs with manager+ roles
  const { data: managerUserIds } = useQuery({
    queryKey: ['manager-eligible-user-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['manager', 'tenant_admin', 'super_admin']);
      if (error) throw error;
      return [...new Set((data || []).map(r => r.user_id))];
    },
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [branchId, setBranchId] = useState<string | undefined>();
  const [divisionId, setDivisionId] = useState<string | undefined>();
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [sectionId, setSectionId] = useState<string | undefined>();
  const [roleTitle, setRoleTitle] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>();
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>("active");

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name);
      setEmail(employee.email);
      setEmployeeNumber(employee.employee_number || "");
      setBranchId(employee.branch_id || undefined);
      // Derive division from department
      const dept = deptList.find(d => d.id === employee.department_id);
      setDivisionId(dept?.division_id || undefined);
      setDepartmentId(employee.department_id || undefined);
      setSectionId(employee.section_id || undefined);
      setRoleTitle(employee.role_title || "");
      setManagerId(employee.manager_id || undefined);
      setHireDate(employee.hire_date || "");
      setStatus(employee.status);
    } else {
      setFullName("");
      setEmail("");
      setEmployeeNumber("");
      setBranchId(undefined);
      setDivisionId(undefined);
      setDepartmentId(undefined);
      setSectionId(undefined);
      setRoleTitle("");
      setManagerId(undefined);
      setHireDate("");
      setStatus("active");
    }
  }, [employee, open, deptList]);

  // Filter departments by selected division
  const filteredDepts = divisionId
    ? deptList.filter(d => d.division_id === divisionId)
    : deptList;

  // Filter sections by selected department
  const filteredSections = departmentId
    ? sections.filter(s => s.department_id === departmentId)
    : sections;

  // When section changes, auto-derive department (and division)
  const handleSectionChange = (val: string) => {
    const secId = val === "none" ? undefined : val;
    setSectionId(secId);
    if (secId) {
      const section = sections.find(s => s.id === secId);
      if (section?.department_id) {
        setDepartmentId(section.department_id);
        const dept = deptList.find(d => d.id === section.department_id);
        if (dept?.division_id) {
          setDivisionId(dept.division_id);
        }
      }
    }
  };

  // When department changes, auto-derive division and clear section
  const handleDepartmentChange = (val: string) => {
    const deptId = val === "none" ? undefined : val;
    setDepartmentId(deptId);
    setSectionId(undefined);
    if (deptId) {
      const dept = deptList.find(d => d.id === deptId);
      if (dept?.division_id) {
        setDivisionId(dept.division_id);
      }
    }
  };

  // When division changes, clear department and section
  const handleDivisionChange = (val: string) => {
    setDivisionId(val === "none" ? undefined : val);
    setDepartmentId(undefined);
    setSectionId(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDept = deptList.find(d => d.id === departmentId);
    onSubmit({
      tenant_id: tenantId,
      full_name: fullName,
      email,
      employee_number: employeeNumber || undefined,
      department: selectedDept?.name || undefined,
      department_id: departmentId || null,
      branch_id: branchId || null,
      section_id: sectionId || null,
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
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('employees.email')} *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeNumber">{t('employees.employeeNumber')}</Label>
            <Input id="employeeNumber" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
          </div>

          {/* Branch Dropdown (independent) */}
          <div className="space-y-2">
            <Label>{t('branches.title')}</Label>
            <Select value={branchId || "none"} onValueChange={(val) => setBranchId(val === "none" ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder={t('branches.selectBranch')} />
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

          {/* Division Dropdown (independent, but cascading down) */}
          <div className="space-y-2">
            <Label>{t('divisions.title')}</Label>
            <Select
              value={divisionId || "none"}
              onValueChange={handleDivisionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('organization.selectDivision')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {divisions.filter(d => d.is_active !== false).map((div) => (
                  <SelectItem key={div.id} value={div.id}>
                    {isAr && div.name_ar ? div.name_ar : div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Dropdown (filtered by Division) */}
          <div className="space-y-2">
            <Label>{t('employees.department')}</Label>
            <Select
              value={departmentId || "none"}
              onValueChange={handleDepartmentChange}
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

          {/* Section Dropdown (filtered by Department) */}
          <div className="space-y-2">
            <Label>{t('sections.title')}</Label>
            <Select
              value={sectionId || "none"}
              onValueChange={handleSectionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('sections.selectSection')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {filteredSections.filter(s => s.is_active !== false).map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {isAr && section.name_ar ? section.name_ar : section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleTitle">{t('employees.role')}</Label>
            <Input id="roleTitle" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('employees.manager')}</Label>
            <ManagerSelect employees={employees} managerEligibleUserIds={managerUserIds} value={managerId} onChange={setManagerId} excludeId={employee?.id} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">{t('employees.hireDate')}</Label>
            <Input id="hireDate" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as EmployeeStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
