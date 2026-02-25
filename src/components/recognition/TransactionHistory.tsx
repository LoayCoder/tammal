import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PointsTransaction } from '@/hooks/recognition/usePoints';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  transactions: PointsTransaction[];
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'credited': return 'default';
    case 'redeemed': return 'secondary';
    case 'expired': return 'destructive';
    case 'revoked': return 'destructive';
    default: return 'outline';
  }
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('recognition.points.noTransactions')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('recognition.points.date')}</TableHead>
          <TableHead>{t('recognition.points.type')}</TableHead>
          <TableHead>{t('recognition.points.description')}</TableHead>
          <TableHead className="text-end">{t('recognition.points.amount')}</TableHead>
          <TableHead>{t('common.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map(tx => (
          <TableRow key={tx.id}>
            <TableCell className="text-sm">
              {format(new Date(tx.awarded_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-sm">
              {t(`recognition.points.sourceTypes.${tx.source_type}`, tx.source_type)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
              {tx.description || '-'}
            </TableCell>
            <TableCell className={`text-end font-medium ${tx.amount > 0 ? 'text-chart-2' : 'text-destructive'}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(tx.status)}>
                {t(`recognition.points.statuses.${tx.status}`, tx.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
