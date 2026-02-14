import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Site } from '@/hooks/useSites';
import type { Branch } from '@/hooks/useBranches';

interface SiteTableProps {
  sites: Site[];
  branches: Branch[];
  onEdit: (site: Site) => void;
  onDelete: (id: string) => void;
}

export function SiteTable({ sites, branches, onEdit, onDelete }: SiteTableProps) {
  const { t, i18n } = useTranslation();

  if (sites.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>;
  }

  const branchMap = new Map(branches.map(b => [b.id, b]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('sites.name')}</TableHead>
          <TableHead>{t('sites.branch')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('sites.address')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sites.map(site => {
          const branch = branchMap.get(site.branch_id);
          const displayName = i18n.language === 'ar' && site.name_ar ? site.name_ar : site.name;
          const displayAddress = i18n.language === 'ar' && site.address_ar ? site.address_ar : site.address;
          const branchName = branch ? (i18n.language === 'ar' && branch.name_ar ? branch.name_ar : branch.name) : '—';
          return (
            <TableRow key={site.id}>
              <TableCell className="font-medium">{displayName}</TableCell>
              <TableCell>{branchName}</TableCell>
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
                        <AlertDialogTitle>{t('sites.deleteSite')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('sites.confirmDelete')}</AlertDialogDescription>
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
