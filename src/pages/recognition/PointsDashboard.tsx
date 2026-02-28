import { useTranslation } from 'react-i18next';
import { usePoints } from '@/hooks/recognition/usePoints';
import { useRedemptionRequests } from '@/hooks/recognition/useRedemption';
import { PointsBalanceCard } from '@/components/recognition/PointsBalanceCard';
import { TransactionHistory } from '@/components/recognition/TransactionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function PointsDashboard() {
  const { t } = useTranslation();
  const { transactions, balance, expiringWithin30Days, isPending: ptsLoading } = usePoints();
  const { requests, isPending: reqLoading } = useRedemptionRequests();

  if (ptsLoading || reqLoading) {
    return <div className="space-y-4 p-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('recognition.points.dashboardTitle')}</h1>
        <p className="text-muted-foreground">{t('recognition.points.dashboardSubtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PointsBalanceCard balance={balance} expiringWithin30Days={expiringWithin30Days} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('recognition.points.totalEarned')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('recognition.points.totalRedeemed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === 'redeemed').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">{t('recognition.points.transactionHistory')}</TabsTrigger>
          <TabsTrigger value="redemptions">{t('recognition.points.myRedemptions')}</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <TransactionHistory transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="redemptions">
          <Card>
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('recognition.points.noRedemptions')}</p>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{(req.redemption_options as any)?.name || req.option_id}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(req.requested_at), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{req.points_spent} pts</span>
                        <Badge variant={req.status === 'fulfilled' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {t(`recognition.points.requestStatuses.${req.status}`, req.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
