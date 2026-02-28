import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { DataTable } from '@/shared/data-table/DataTable';
import type { ColumnDef } from '@/shared/data-table/types';
import type { Plan } from '@/hooks/usePlans';

interface PlanTableProps {
  plans: Plan[];
  isLoading: boolean;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlanTable({ plans, isLoading, onEdit, onDelete }: PlanTableProps) {
  const { t, i18n } = useTranslation();

  const formatPrice = (price: number) => formatCurrency(price, i18n.language);

  const formatMaxUsers = (maxUsers: number | null) => {
    if (maxUsers === null || maxUsers === -1) return t('plans.unlimited');
    return maxUsers;
  };

  const columns: ColumnDef<Plan>[] = [
    {
      id: 'name',
      header: t('plans.name'),
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: 'price',
      header: t('plans.price'),
      cell: (row) => formatPrice(Number(row.price)),
    },
    {
      id: 'billing_period',
      header: t('plans.billingPeriod'),
      cell: (row) => <span className="capitalize">{row.billing_period}</span>,
    },
    {
      id: 'max_users',
      header: t('plans.maxUsers'),
      cell: (row) => formatMaxUsers(row.max_users),
    },
    {
      id: 'max_storage',
      header: t('plans.maxStorage'),
      cell: (row) => <>{row.max_storage_gb ?? '-'} GB</>,
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'outline'}>
          {row.is_active ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <Pencil className="me-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.id)}
              className="text-destructive"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={plans}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      bordered={false}
    />
  );
}
