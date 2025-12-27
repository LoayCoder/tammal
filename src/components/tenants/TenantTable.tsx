import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantStatusBadge } from './TenantStatusBadge';
import type { Tenant } from '@/hooks/useTenants';
import type { Plan } from '@/hooks/usePlans';

type TenantWithPlan = Tenant & {
  plan?: Plan | null;
};

interface TenantTableProps {
  tenants: TenantWithPlan[];
  isLoading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
}

export function TenantTable({ tenants, isLoading, onEdit, onDelete }: TenantTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return <p className="text-muted-foreground">{t('common.noData')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('tenants.name')}</TableHead>
          <TableHead>{t('tenants.slug')}</TableHead>
          <TableHead>{t('tenants.plan')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead>{t('tenants.createdAt')}</TableHead>
          <TableHead className="text-end">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.id}>
            <TableCell>
              <div>
                <span className="font-medium">{tenant.name}</span>
                {tenant.domain && (
                  <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground font-mono text-sm">
              {tenant.slug || '-'}
            </TableCell>
            <TableCell>
              {tenant.plan ? (
                <Badge variant="outline">{tenant.plan.name}</Badge>
              ) : (
                <Badge variant="secondary">{t('tenants.noPlan')}</Badge>
              )}
            </TableCell>
            <TableCell>
              <TenantStatusBadge status={tenant.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(tenant.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(tenant)}>
                    <Settings2 className="me-2 h-4 w-4" />
                    {t('tenants.manage')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(tenant.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
