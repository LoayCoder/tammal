import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Branch } from '@/hooks/useBranches';
import type { Department } from '@/hooks/useDepartments';

interface BranchTableProps {
  branches: Branch[];
  departments: Department[];
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
}

export function BranchTable({ branches, departments, onEdit, onDelete }: BranchTableProps) {
  const { t, i18n } = useTranslation();

  if (branches.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('divisions.name')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('divisions.address')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('divisions.phone')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('divisions.email')}</TableHead>
          <TableHead>{t('organization.departments')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.map(branch => {
          const deptCount = departments.filter(d => d.branch_id === branch.id).length;
          const displayName = i18n.language === 'ar' && branch.name_ar ? branch.name_ar : branch.name;
          const displayAddress = i18n.language === 'ar' && branch.address_ar ? branch.address_ar : branch.address;
          return (
            <TableRow key={branch.id}>
              <TableCell className="font-medium">{displayName}</TableCell>
              <TableCell className="hidden md:table-cell">{displayAddress || '—'}</TableCell>
              <TableCell className="hidden sm:table-cell">{branch.phone || '—'}</TableCell>
              <TableCell className="hidden sm:table-cell">{branch.email || '—'}</TableCell>
              <TableCell><Badge variant="secondary">{deptCount}</Badge></TableCell>
              <TableCell>
                <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                  {branch.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(branch)}>
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
                        <AlertDialogAction onClick={() => onDelete(branch.id)}>{t('common.delete')}</AlertDialogAction>
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
