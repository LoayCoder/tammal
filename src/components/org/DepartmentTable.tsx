import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Department } from '@/hooks/useDepartments';
import type { Division } from '@/hooks/useDivisions';
import type { Employee } from '@/hooks/useEmployees';

interface DepartmentTableProps {
  departments: Department[];
  divisions: Division[];
  employees: Employee[];
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
}

export function DepartmentTable({ departments, divisions, employees, onEdit, onDelete }: DepartmentTableProps) {
  const { t, i18n } = useTranslation();

  if (departments.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  const divisionMap = new Map(divisions.map(d => [d.id, d]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('organization.name')}</TableHead>
          <TableHead>{t('divisions.title')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('organization.head')}</TableHead>
          <TableHead>{t('organization.members')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map(dept => {
          const displayName = i18n.language === 'ar' && dept.name_ar ? dept.name_ar : dept.name;
          const division = dept.division_id ? divisionMap.get(dept.division_id) : null;
          const divisionName = division
            ? (i18n.language === 'ar' && division.name_ar ? division.name_ar : division.name)
            : '—';
          const headEmployee = dept.head_employee_id
            ? employees.find(e => e.id === dept.head_employee_id)
            : null;
          const empCount = employees.filter(e => (e as any).department_id === dept.id).length;

          return (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: dept.color }}
                  />
                  {displayName}
                </div>
              </TableCell>
              <TableCell>{divisionName}</TableCell>
              <TableCell className="hidden md:table-cell">
                {headEmployee?.full_name || '—'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" /> {empCount}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                  {dept.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(dept)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('organization.deleteDepartment')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('organization.confirmDeleteDept')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(dept.id)}>{t('common.delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
