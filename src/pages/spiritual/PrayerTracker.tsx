import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, TrendingUp } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { usePrayerTimes, PRAYER_NAMES } from '@/hooks/spiritual/usePrayerTimes';
import { usePrayerLogs } from '@/hooks/spiritual/usePrayerLogs';
import { PrayerCard } from '@/components/spiritual/PrayerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrayerTracker() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences, isLoading: prefsLoading } = useSpiritualPreferences();

  // Redirect if not enabled
  const isActive = preferences?.enabled && preferences?.prayer_enabled;

  const { data: prayerData, isLoading: timesLoading } = usePrayerTimes(
    preferences?.city,
    preferences?.country,
    preferences?.calculation_method
  );

  const today = new Date().toISOString().split('T')[0];

  // Get 7-day range for weekly summary
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const { logs, todayLogs, logPrayer, isLoading: logsLoading } = usePrayerLogs({ from: weekAgo, to: today });

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const totalPossible = 7 * 5; // 7 days × 5 prayers
    const completed = logs.filter((l) => l.status.startsWith('completed')).length;
    const pct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    return { completed, totalPossible, pct };
  }, [logs]);

  const handleLog = (prayerName: string, status: string) => {
    logPrayer.mutate({ prayer_name: prayerName, prayer_date: today, status });
  };

  if (prefsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="container mx-auto py-6">
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="p-12 text-center space-y-4">
            <Moon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.prayer.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.prayer.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const noLocation = !preferences?.city || !preferences?.country;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Moon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('spiritual.prayer.title')}</h1>
          <p className="text-muted-foreground">{t('spiritual.prayer.subtitle')}</p>
        </div>
      </div>

      {/* Hijri date */}
      {prayerData?.date?.hijri && (
        <p className="text-sm text-muted-foreground">
          {i18n.language === 'ar'
            ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.ar} ${prayerData.date.hijri.year} هـ`
            : `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
          }
        </p>
      )}

      {noLocation ? (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">{t('spiritual.prayer.setLocation')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      ) : timesLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          {/* Prayer cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRAYER_NAMES.map((name) => (
              <PrayerCard
                key={name}
                prayerName={name}
                prayerTime={prayerData?.timings?.[name] ?? '--:--'}
                log={todayLogs[name]}
                onLog={(status) => handleLog(name, status)}
                isPending={logPrayer.isPending}
              />
            ))}
          </div>

          {/* Weekly summary */}
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                {t('spiritual.prayer.weeklySummary')}
              </CardTitle>
              <CardDescription>{t('spiritual.prayer.weeklyDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{weeklyStats.pct}%</div>
                <div className="text-sm text-muted-foreground">
                  {t('spiritual.prayer.weeklyDetail', {
                    completed: weeklyStats.completed,
                    total: weeklyStats.totalPossible,
                  })}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground italic">
                {weeklyStats.pct >= 80
                  ? t('spiritual.prayer.feedback.excellent')
                  : weeklyStats.pct >= 50
                    ? t('spiritual.prayer.feedback.good')
                    : t('spiritual.prayer.feedback.encouragement')
                }
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
