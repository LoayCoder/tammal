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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Plan } from '@/hooks/usePlans';

interface PlanTableProps {
  plans: Plan[];
  isLoading: boolean;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlanTable({ plans, isLoading, onEdit, onDelete }: PlanTableProps) {
  const { t, i18n } = useTranslation();

  const formatPrice = (price: number) => {
    return formatCurrency(price, i18n.language);
  };

  const formatMaxUsers = (maxUsers: number | null) => {
    if (maxUsers === null || maxUsers === -1) return t('plans.unlimited');
    return maxUsers;
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

  if (plans.length === 0) {
    return <p className="text-muted-foreground">{t('common.noData')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('plans.name')}</TableHead>
          <TableHead>{t('plans.price')}</TableHead>
          <TableHead>{t('plans.billingPeriod')}</TableHead>
          <TableHead>{t('plans.maxUsers')}</TableHead>
          <TableHead>{t('plans.maxStorage')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
          <TableHead className="text-end">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.name}</TableCell>
            <TableCell>{formatPrice(Number(plan.price))}</TableCell>
            <TableCell className="capitalize">{plan.billing_period}</TableCell>
            <TableCell>{formatMaxUsers(plan.max_users)}</TableCell>
            <TableCell>{plan.max_storage_gb ?? '-'} GB</TableCell>
            <TableCell>
              <Badge variant={plan.is_active ? 'default' : 'outline'}>
                {plan.is_active ? t('common.active') : t('common.inactive')}
              </Badge>
            </TableCell>
            <TableCell className="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(plan)}>
                    <Pencil className="me-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(plan.id)}
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
