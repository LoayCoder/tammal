import { useTranslation } from 'react-i18next';
import { useRedemptionCatalog, useRedemptionRequests } from '@/hooks/recognition/useRedemption';
import { usePoints } from '@/hooks/recognition/usePoints';
import { RedemptionCard } from '@/components/recognition/RedemptionCard';
import { PointsBalanceCard } from '@/components/recognition/PointsBalanceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const CATEGORIES = ['all', 'time_off', 'cash_equivalent', 'experience', 'charity', 'merchandise'] as const;

export default function RedemptionCatalog() {
  const { t } = useTranslation();
  const { options, isLoading: catLoading } = useRedemptionCatalog();
  const { balance, expiringWithin30Days, isLoading: ptsLoading } = usePoints();
  const { redeem } = useRedemptionRequests();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all' ? options : options.filter(o => o.category === activeCategory);

  if (catLoading || ptsLoading) {
    return <div className="space-y-4 p-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('recognition.points.catalogTitle')}</h1>
        <p className="text-muted-foreground">{t('recognition.points.catalogSubtitle')}</p>
      </div>

      <div className="max-w-sm">
        <PointsBalanceCard balance={balance} expiringWithin30Days={expiringWithin30Days} />
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {t(`recognition.points.categories.${cat}`, cat)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('recognition.points.noOptions')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(option => (
            <RedemptionCard
              key={option.id}
              option={option}
              balance={balance}
              onRedeem={(id, cost) => redeem.mutate({ optionId: id, pointsCost: cost })}
              isRedeeming={redeem.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
