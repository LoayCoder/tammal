import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { Employee } from "@/hooks/org/useEmployees";
import { Edit2, Trash2, MoreHorizontal, User, Mail } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useDepartments } from "@/hooks/org/useDepartments";
import { useDivisions } from "@/hooks/org/useDivisions";
import { useSites } from "@/hooks/org/useSites";
import { useBranches } from "@/hooks/org/useBranches";

interface UnifiedEmployee extends Employee {
  accountStatus?: 'not_invited' | 'invited' | 'active' | 'suspended' | 'inactive';
  roleName?: string;
  roleColor?: string;
}

interface EmployeeTableProps {
  employees: (Employee | UnifiedEmployee)[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onInvite?: (employee: Employee) => void;
  showAccountStatus?: boolean;
}

export function EmployeeTable({ employees, onEdit, onDelete, onInvite, showAccountStatus }: EmployeeTableProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { departments } = useDepartments();
  const { divisions } = useDivisions();
  const { sites: sections } = useSites();
  const { branches } = useBranches();

  const deptMap = new Map(departments.map(d => [d.id, d]));
  const divisionMap = new Map(divisions.map(d => [d.id, d]));
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const branchMap = new Map(branches.map(b => [b.id, b]));

  const getDisplayName = (entity: { name: string; name_ar?: string | null } | undefined) => {
    if (!entity) return '—';
    return isAr && entity.name_ar ? entity.name_ar : entity.name;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.name')}</TableHead>
              <TableHead>{t('employees.email')}</TableHead>
              <TableHead>{t('divisions.title')}</TableHead>
              <TableHead>{t('employees.department')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('sections.title')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('branches.title')}</TableHead>
              <TableHead>{t('employees.role')}</TableHead>
              {showAccountStatus && (
                <TableHead>{t('userManagement.accountStatus')}</TableHead>
              )}
              {showAccountStatus && (
                <TableHead>{t('users.role')}</TableHead>
              )}
              <TableHead className="hidden md:table-cell">{t('employees.hireDate')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="w-12">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAccountStatus ? 12 : 10} className="text-center py-8 text-muted-foreground">
                  {t('employees.noEmployees')}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const unified = employee as UnifiedEmployee;
                const dept = employee.department_id ? deptMap.get(employee.department_id) : null;
                const division = dept?.division_id ? divisionMap.get(dept.division_id) : null;
                const section = employee.section_id ? sectionMap.get(employee.section_id) : null;
                const branch = employee.branch_id ? branchMap.get(employee.branch_id) : null;
                const effectiveColor = section?.color && section.color !== '#3B82F6' ? section.color
                  : dept?.color && dept.color !== '#3B82F6' ? dept.color
                  : division?.color || undefined;

                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {effectiveColor && (
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: effectiveColor }}
                          />
                        )}
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          {employee.employee_number && (
                            <p className="text-xs text-muted-foreground">#{employee.employee_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{getDisplayName(division ?? undefined)}</TableCell>
                    <TableCell>{getDisplayName(dept ?? undefined)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getDisplayName(section ?? undefined)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getDisplayName(branch ?? undefined)}</TableCell>
                    <TableCell>{employee.role_title || '—'}</TableCell>
                    {showAccountStatus && (
                      <TableCell>
                        {unified.accountStatus && (
                          <AccountStatusBadge status={unified.accountStatus} />
                        )}
                      </TableCell>
                    )}
                    {showAccountStatus && (
                      <TableCell>
                        {unified.roleName ? (
                          <Badge
                            variant="outline"
                            style={unified.roleColor ? { borderColor: unified.roleColor, color: unified.roleColor } : undefined}
                          >
                            {unified.roleName}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                    )}
                    <TableCell className="hidden md:table-cell">
                      {employee.hire_date ? format(new Date(employee.hire_date), 'PP') : '—'}
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={employee.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(employee)}>
                            <Edit2 className="h-4 w-4 me-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          {!employee.user_id && onInvite && (
                            <DropdownMenuItem onClick={() => onInvite(employee)}>
                              <Mail className="h-4 w-4 me-2" />
                              {t('employees.sendInvite')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('employees.deleteEmployee')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('employees.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
