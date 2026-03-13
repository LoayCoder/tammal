import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Moon, TrendingUp, Check } from 'lucide-react';
import { useSpiritualPreferences } from '@/features/spiritual/hooks/spiritual/useSpiritualPreferences';
import { usePrayerTimes, PRAYER_NAMES } from '@/features/spiritual/hooks/spiritual/usePrayerTimes';
import { usePrayerLogs } from '@/features/spiritual/hooks/spiritual/usePrayerLogs';
import { useSunnahLogs, SUNNAH_PRACTICES } from '@/features/spiritual/hooks/spiritual/useSunnahLogs';
import { usePrayerCountdown } from '@/features/spiritual/hooks/spiritual/usePrayerCountdown';
import { useWitrCountdown } from '@/features/spiritual/hooks/spiritual/useWitrCountdown';
import { PrayerCard } from '@/features/spiritual/components/PrayerCard';
import { PrayerHistory } from '@/features/spiritual/components/PrayerHistory';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';

export default function PrayerTracker() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences, isPending: prefsLoading } = useSpiritualPreferences();

  const isActive = preferences?.enabled && preferences?.prayer_enabled;

  const { data: prayerData, isLoading: timesLoading } = usePrayerTimes(
    preferences?.city,
    preferences?.country,
    preferences?.calculation_method
  );

  const today = new Date().toISOString().split('T')[0];

  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const { logs, todayLogs, logPrayer, isPending: logsLoading } = usePrayerLogs({ from: weekAgo, to: today });
  const { todayCompleted, togglePractice, isPending: sunnahLoading } = useSunnahLogs();

  // Countdowns for each prayer
  const fajrCountdown = usePrayerCountdown(prayerData?.timings?.Fajr);
  const dhuhrCountdown = usePrayerCountdown(prayerData?.timings?.Dhuhr);
  const asrCountdown = usePrayerCountdown(prayerData?.timings?.Asr);
  const maghribCountdown = usePrayerCountdown(prayerData?.timings?.Maghrib);
  const ishaCountdown = usePrayerCountdown(prayerData?.timings?.Isha);
  const witrCountdown = useWitrCountdown(prayerData?.timings?.Fajr);

  const duha = SUNNAH_PRACTICES.find(p => p.key === 'duha')!;

  const weeklyStats = useMemo(() => {
    const totalPossible = 7 * 6; // 5 obligatory + Witr
    const completed = logs.filter((l) => l.status.startsWith('completed')).length;
    const pct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    return { completed, totalPossible, pct };
  }, [logs]);

  const handleLog = (prayerName: string, status: string) => {
    logPrayer.mutate({ prayer_name: prayerName, prayer_date: today, status });
  };

  const handleToggleSunnah = (prayerName: string, type: 'before' | 'after', completed: boolean) => {
    togglePractice.mutate({ practice_type: `rawatib_${prayerName.toLowerCase()}_${type}`, completed });
  };

  if (prefsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div><Skeleton className="h-8 w-48" /></div>
        <div><Skeleton className="h-64" /></div>
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
  const duhaCompleted = todayCompleted.has('duha');

  const countdowns: Record<string, ReturnType<typeof usePrayerCountdown>> = {
    Fajr: fajrCountdown,
    Dhuhr: dhuhrCountdown,
    Asr: asrCountdown,
    Maghrib: maghribCountdown,
    Isha: ishaCountdown,
  };

  const fajrClean = (prayerData?.timings?.Fajr || '').replace(/\s*\(.*\)/, '').trim();
  const witrTimeLabel = t('spiritual.prayer.witrTimeRange', { fajr: fajrClean || '--:--' });

  const renderPrayerCard = (name: string) => {
    if (name === 'Witr') {
      return (
        <PrayerCard
          key="Witr"
          prayerName="Witr"
          prayerTime="22:00"
          timeLabel={witrTimeLabel}
          log={todayLogs['Witr']}
          onLog={(status) => handleLog('Witr', status)}
          isPending={logPrayer.isPending}
          countdownMinutes={witrCountdown.minutesLeft}
          isExpired={witrCountdown.isExpired}
          isPrayerTime={witrCountdown.isPrayerTime}
          onAutoMiss={() => handleLog('Witr', 'missed')}
        />
      );
    }
    const cd = countdowns[name];
    return (
      <PrayerCard
        key={name}
        prayerName={name}
        prayerTime={prayerData?.timings?.[name as keyof typeof prayerData.timings] ?? '--:--'}
        log={todayLogs[name]}
        onLog={(status) => handleLog(name, status)}
        isPending={logPrayer.isPending}
        sunnahBefore={todayCompleted.has(`rawatib_${name.toLowerCase()}_before`)}
        sunnahAfter={todayCompleted.has(`rawatib_${name.toLowerCase()}_after`)}
        onToggleSunnah={(type, done) => handleToggleSunnah(name, type, done)}
        sunnahPending={togglePractice.isPending}
        countdownMinutes={cd.minutesLeft}
        isExpired={cd.isExpired}
        isPrayerTime={cd.isPrayerTime}
        onAutoMiss={() => handleLog(name, 'missed')}
      />
    );
  };

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
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {renderPrayerCard('Fajr')}

            {/* Duha card */}
            <Card className={cn(
              'glass-card border rounded-xl transition-all duration-300',
              duhaCompleted ? 'border-primary/40 bg-primary/[0.01]' : ''
            )}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{duha.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-base">
                        {i18n.language === 'ar' ? duha.labelAr : duha.labelEn}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {i18n.language === 'ar' ? 'صلاة نافلة الضحى' : 'Mid-morning voluntary prayer'}
                      </p>
                    </div>
                  </div>
                  {duhaCompleted && <Check className="h-5 w-5 text-primary" />}
                </div>
                <Button
                  size="sm"
                  variant={duhaCompleted ? 'secondary' : 'outline'}
                  onClick={() => togglePractice.mutate({ practice_type: 'duha', completed: !duhaCompleted })}
                  disabled={togglePractice.isPending}
                  className="w-full gap-1"
                >
                  {duhaCompleted
                    ? (i18n.language === 'ar' ? 'تراجع' : 'Undo')
                    : (i18n.language === 'ar' ? 'تم ✓' : 'Done ✓')
                  }
                </Button>
              </CardContent>
            </Card>

            {renderPrayerCard('Dhuhr')}
            {renderPrayerCard('Asr')}
            {renderPrayerCard('Maghrib')}
            {renderPrayerCard('Isha')}
            {renderPrayerCard('Witr')}
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

          {/* Prayer History & Trends */}
          <PrayerHistory />
        </>
      )}
    </div>
  );
}


