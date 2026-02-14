import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { Employee } from "@/hooks/useEmployees";
import { Edit2, Trash2, MoreHorizontal, User, Mail } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  const { t } = useTranslation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.name')}</TableHead>
              <TableHead>{t('employees.email')}</TableHead>
              <TableHead>{t('employees.department')}</TableHead>
              <TableHead>{t('employees.role')}</TableHead>
              {showAccountStatus && (
                <TableHead>{t('userManagement.accountStatus')}</TableHead>
              )}
              {showAccountStatus && (
                <TableHead>{t('users.role')}</TableHead>
              )}
              <TableHead>{t('employees.hireDate')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="w-12">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAccountStatus ? 9 : 7} className="text-center py-8 text-muted-foreground">
                  {t('employees.noEmployees')}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const unified = employee as UnifiedEmployee;
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          {employee.employee_number && (
                            <p className="text-xs text-muted-foreground">#{employee.employee_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>{employee.role_title || '-'}</TableCell>
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
                        ) : '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      {employee.hire_date ? format(new Date(employee.hire_date), 'PP') : '-'}
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
