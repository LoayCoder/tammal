import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { WorkSite } from '@/hooks/org/useWorkSites';
import type { Department } from '@/hooks/org/useDepartments';
import type { Site } from '@/hooks/org/useSites';

interface WorkSiteTableProps {
  workSites: WorkSite[];
  departments: Department[];
  sections: Site[];
  onEdit: (workSite: WorkSite) => void;
  onDelete: (id: string) => void;
}

export function WorkSiteTable({ workSites, departments, sections, onEdit, onDelete }: WorkSiteTableProps) {
  const { t, i18n } = useTranslation();

  if (workSites.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  const deptMap = new Map(departments.map(d => [d.id, d]));
  const sectionMap = new Map(sections.map(s => [s.id, s]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('workSites.name')}</TableHead>
          <TableHead>{t('organization.departments')}</TableHead>
          <TableHead>{t('sections.title')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('workSites.address')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workSites.map(ws => {
          const dept = ws.department_id ? deptMap.get(ws.department_id) : null;
          const section = ws.section_id ? sectionMap.get(ws.section_id) : null;
          const displayName = i18n.language === 'ar' && ws.name_ar ? ws.name_ar : ws.name;
          const displayAddress = i18n.language === 'ar' && ws.address_ar ? ws.address_ar : ws.address;
          const deptName = dept ? (i18n.language === 'ar' && dept.name_ar ? dept.name_ar : dept.name) : '—';
          const sectionName = section ? (i18n.language === 'ar' && section.name_ar ? section.name_ar : section.name) : '—';
          return (
            <TableRow key={ws.id}>
              <TableCell className="font-medium">{displayName}</TableCell>
              <TableCell>{deptName}</TableCell>
              <TableCell>{sectionName}</TableCell>
              <TableCell className="hidden md:table-cell">{displayAddress || '—'}</TableCell>
              <TableCell>
                <Badge variant={ws.is_active ? 'default' : 'secondary'}>
                  {ws.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(ws)}>
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
                        <AlertDialogTitle>{t('workSites.deleteSite')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('workSites.confirmDelete')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(ws.id)}>{t('common.delete')}</AlertDialogAction>
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
