import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Site } from '@/hooks/useSites';
import type { Branch } from '@/hooks/useBranches';
import type { Department } from '@/hooks/useDepartments';
import type { Employee } from '@/hooks/useEmployees';

interface SiteTableProps {
  sites: Site[];
  branches: Branch[];
  departments: Department[];
  employees: Employee[];
  onEdit: (site: Site) => void;
  onDelete: (id: string) => void;
}

export function SiteTable({ sites, branches, departments, employees, onEdit, onDelete }: SiteTableProps) {
  const { t, i18n } = useTranslation();

  if (sites.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  const branchMap = new Map(branches.map(b => [b.id, b]));
  const deptMap = new Map(departments.map(d => [d.id, d]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('sections.name')}</TableHead>
          <TableHead>{t('sections.department')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('organization.head')}</TableHead>
          <TableHead>{t('organization.members')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('sections.address')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sites.map(site => {
          const dept = site.department_id ? deptMap.get(site.department_id) : null;
          const displayName = i18n.language === 'ar' && site.name_ar ? site.name_ar : site.name;
          const displayAddress = i18n.language === 'ar' && site.address_ar ? site.address_ar : site.address;
          const deptName = dept ? (i18n.language === 'ar' && dept.name_ar ? dept.name_ar : dept.name) : '—';
          const headEmployee = site.head_employee_id
            ? employees.find(e => e.id === site.head_employee_id)
            : null;
          const memberCount = employees.filter(e => (e as any).section_id === site.id).length;
          return (
            <TableRow key={site.id}>
              <TableCell className="font-medium">{displayName}</TableCell>
              <TableCell>{deptName}</TableCell>
              <TableCell className="hidden md:table-cell">
                {headEmployee?.full_name || '—'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" /> {memberCount}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{displayAddress || '—'}</TableCell>
              <TableCell>
                <Badge variant={site.is_active ? 'default' : 'secondary'}>
                  {site.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(site)}>
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
                        <AlertDialogTitle>{t('sections.deleteSection')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('sections.confirmDelete')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(site.id)}>{t('common.delete')}</AlertDialogAction>
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
