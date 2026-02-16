import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Division } from '@/hooks/useDivisions';
import type { Department } from '@/hooks/useDepartments';
import type { Employee } from '@/hooks/useEmployees';

interface DivisionTableProps {
  divisions: Division[];
  departments: Department[];
  employees: Employee[];
  onEdit: (division: Division) => void;
  onDelete: (id: string) => void;
}

export function DivisionTable({ divisions, departments, employees, onEdit, onDelete }: DivisionTableProps) {
  const { t, i18n } = useTranslation();

  if (divisions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('divisions.name')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('organization.description')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('organization.head')}</TableHead>
          <TableHead>{t('organization.members')}</TableHead>
          <TableHead>{t('organization.departments')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {divisions.map(div => {
          const deptCount = departments.filter(d => d.division_id === div.id).length;
          const divDeptIds = departments.filter(d => d.division_id === div.id).map(d => d.id);
          const memberCount = employees.filter(e => (e as any).department_id && divDeptIds.includes((e as any).department_id)).length;
          const headEmployee = div.head_employee_id
            ? employees.find(e => e.id === div.head_employee_id)
            : null;
          const displayName = i18n.language === 'ar' && div.name_ar ? div.name_ar : div.name;
          const displayDesc = i18n.language === 'ar' && div.description_ar ? div.description_ar : div.description;
          return (
            <TableRow key={div.id}>
              <TableCell className="font-medium">{displayName}</TableCell>
              <TableCell className="hidden md:table-cell">{displayDesc || '—'}</TableCell>
              <TableCell className="hidden md:table-cell">
                {headEmployee?.full_name || '—'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" /> {memberCount}
                </Badge>
              </TableCell>
              <TableCell><Badge variant="secondary">{deptCount}</Badge></TableCell>
              <TableCell>
                <Badge variant={div.is_active ? 'default' : 'secondary'}>
                  {div.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(div)}>
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
                        <AlertDialogTitle>{t('divisions.deleteDivision')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('divisions.confirmDelete')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(div.id)}>{t('common.delete')}</AlertDialogAction>
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
