import { useTranslation } from 'react-i18next';
import { Trophy, Flame, Star, Coins, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PageHeader, MetricCard, DashboardGrid } from '@/components/system';
import { EngagementRankBadge } from '@/components/dashboard/EngagementRankBadge';
import { TransactionHistory } from '@/components/recognition/TransactionHistory';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { usePoints } from '@/hooks/recognition/usePoints';
import { useEmployeeEngagementRank } from '@/hooks/wellness/useEmployeeEngagementRank';
import { useRedemptionRequests } from '@/hooks/recognition/useRedemption';
import { typography } from '@/theme/tokens';

export default function GamificationDashboard() {
  const { t } = useTranslation();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isPending: gamLoading } = useGamification(employee?.id ?? null);
  const { transactions, balance, expiringWithin30Days, isPending: ptsLoading } = usePoints();
  const { rank, totalEmployees, isPending: rankLoading, error: rankError } = useEmployeeEngagementRank(employee?.id, employee?.tenant_id);
  const { requests, isPending: reqLoading } = useRedemptionRequests();

  const isLoading = empLoading || gamLoading || ptsLoading || rankLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="px-4 sm:px-6 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy className="h-5 w-5" strokeWidth={1.5} />}
        title={t('gamification.title', 'Gamification')}
        subtitle={t('gamification.subtitle', 'Track your streaks, points, rank and achievements')}
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-5xl">
        {/* ── Stat cards ── */}
        <DashboardGrid columns={4}>
          <MetricCard
            title={t('gamification.currentStreak', 'Current Streak')}
            value={streak}
            icon={<Flame className="h-4 w-4" strokeWidth={1.5} />}
            description={t('gamification.days', '{{count}} days', { count: streak })}
          />
          <MetricCard
            title={t('gamification.wellnessPoints', 'Wellness Points')}
            value={totalPoints.toLocaleString()}
            icon={<Star className="h-4 w-4" strokeWidth={1.5} />}
            description={t('gamification.fromCheckins', 'From daily check-ins')}
          />
          <MetricCard
            title={t('gamification.recognitionBalance', 'Recognition Balance')}
            value={balance.toLocaleString()}
            icon={<Coins className="h-4 w-4" strokeWidth={1.5} />}
            description={
              expiringWithin30Days > 0
                ? t('gamification.expiringSoon', '{{count}} expiring soon', { count: expiringWithin30Days })
                : undefined
            }
          />
          <MetricCard
            title={t('gamification.engagementRank', 'Engagement Rank')}
            value={rank > 0 ? `#${rank}` : '—'}
            icon={<Medal className="h-4 w-4" strokeWidth={1.5} />}
            description={
              totalEmployees > 0
                ? t('home.outOfEmployees', { count: totalEmployees })
                : undefined
            }
          />
        </DashboardGrid>

        {/* ── Engagement rank badge ── */}
        <EngagementRankBadge
          rank={rank}
          totalEmployees={totalEmployees}
          isPending={false}
          error={rankError}
        />

        {/* ── Tabbed history ── */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">
              {t('recognition.points.transactionHistory', 'Points History')}
            </TabsTrigger>
            <TabsTrigger value="redemptions">
              {t('recognition.points.myRedemptions', 'Redemptions')}
            </TabsTrigger>
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
                  <p className="text-center text-muted-foreground py-8">
                    {t('recognition.points.noRedemptions', 'No redemptions yet')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-sm">
                            {(req.redemption_options as any)?.name || req.option_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.requested_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{req.points_spent} pts</span>
                          <Badge
                            variant={
                              req.status === 'fulfilled'
                                ? 'default'
                                : req.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
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
    </div>
  );
}
