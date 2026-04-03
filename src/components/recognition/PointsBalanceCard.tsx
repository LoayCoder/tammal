import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, AlertTriangle } from 'lucide-react';

interface PointsBalanceCardProps {
  balance: number;
  expiringWithin30Days: number;
}

export function PointsBalanceCard({ balance, expiringWithin30Days }: PointsBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t('recognition.points.balance')}
        </CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{balance.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('recognition.points.availablePoints')}
        </p>
        {expiringWithin30Days > 0 && (
          <div className="flex items-center gap-1 mt-3">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs text-destructive">
              {t('recognition.points.expiringSoon', { count: expiringWithin30Days })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
