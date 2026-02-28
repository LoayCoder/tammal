import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/shared/data-table/DataTable';
import type { ColumnDef } from '@/shared/data-table/types';

interface SubscriptionWithRelations {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  payment_status: string;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  tenant?: { id: string; name: string } | null;
  plan?: { id: string; name: string; price: number } | null;
}

interface SubscriptionTableProps {
  subscriptions: SubscriptionWithRelations[];
  isLoading: boolean;
  onEdit: (subscription: SubscriptionWithRelations) => void;
  onDelete: (id: string) => void;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  trial: 'secondary',
  suspended: 'destructive',
  cancelled: 'outline',
};

const PAYMENT_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  overdue: 'destructive',
};

export function SubscriptionTable({
  subscriptions,
  isLoading,
  onEdit,
  onDelete,
}: SubscriptionTableProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<SubscriptionWithRelations>[] = [
    {
      id: 'tenant',
      header: t('subscriptions.tenant'),
      cell: (row) => <span className="font-medium">{row.tenant?.name || '-'}</span>,
    },
    {
      id: 'plan',
      header: t('subscriptions.plan'),
      cell: (row) => (
        <>
          {row.plan?.name || '-'}
          {row.plan?.price && (
            <span className="text-muted-foreground text-sm ms-1">
              (${row.plan.price})
            </span>
          )}
        </>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] || 'secondary'}>
          {t(`common.${row.status}`) || row.status}
        </Badge>
      ),
    },
    {
      id: 'payment_status',
      header: t('subscriptions.paymentStatus'),
      cell: (row) => (
        <Badge variant={PAYMENT_VARIANTS[row.payment_status] || 'secondary'}>
          {t(`subscriptions.${row.payment_status}`) || row.payment_status}
        </Badge>
      ),
    },
    {
      id: 'start_date',
      header: t('subscriptions.startDate'),
      cell: (row) =>
        row.start_date ? format(new Date(row.start_date), 'PP') : '-',
    },
    {
      id: 'renewal_date',
      header: t('subscriptions.renewalDate'),
      cell: (row) =>
        row.renewal_date ? format(new Date(row.renewal_date), 'PP') : '-',
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
              <Pencil className="h-4 w-4 me-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.id)}
            >
              <Trash2 className="h-4 w-4 me-2" />
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
      data={subscriptions}
      rowKey={(row) => row.id}
      isLoading={isLoading}
    />
  );
}
