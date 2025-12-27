import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

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

export function SubscriptionTable({
  subscriptions,
  isLoading,
  onEdit,
  onDelete,
}: SubscriptionTableProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`common.${status}`) || status}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
    };
    return (
      <Badge variant={variants[paymentStatus] || 'secondary'}>
        {t(`subscriptions.${paymentStatus}`) || paymentStatus}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('subscriptions.tenant')}</TableHead>
            <TableHead>{t('subscriptions.plan')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead>{t('subscriptions.paymentStatus')}</TableHead>
            <TableHead>{t('subscriptions.startDate')}</TableHead>
            <TableHead>{t('subscriptions.renewalDate')}</TableHead>
            <TableHead className="text-end">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.tenant?.name || '-'}
              </TableCell>
              <TableCell>
                {subscription.plan?.name || '-'}
                {subscription.plan?.price && (
                  <span className="text-muted-foreground text-sm ms-1">
                    (${subscription.plan.price})
                  </span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
              <TableCell>{getPaymentBadge(subscription.payment_status)}</TableCell>
              <TableCell>
                {subscription.start_date
                  ? format(new Date(subscription.start_date), 'PP')
                  : '-'}
              </TableCell>
              <TableCell>
                {subscription.renewal_date
                  ? format(new Date(subscription.renewal_date), 'PP')
                  : '-'}
              </TableCell>
              <TableCell className="text-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(subscription)}>
                      <Pencil className="h-4 w-4 me-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(subscription.id)}
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
