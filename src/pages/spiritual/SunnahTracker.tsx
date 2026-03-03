import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Check, TrendingUp } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useSunnahLogs, SUNNAH_PRACTICES } from '@/hooks/spiritual/useSunnahLogs';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function SunnahTracker() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { preferences, isPending: prefsLoading } = useSpiritualPreferences();
  const isActive = preferences?.enabled && preferences?.fasting_enabled;

  const { isPending, togglePractice, todayCompleted, stats, totalCompleted } = useSunnahLogs();

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
            <Star className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.sunnah.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.sunnah.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = (practiceKey: string) => {
    const isCompleted = todayCompleted.has(practiceKey);
    togglePractice.mutate({ practice_type: practiceKey, completed: !isCompleted });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('spiritual.sunnah.title')}</h1>
          <p className="text-muted-foreground">{t('spiritual.sunnah.subtitle')}</p>
        </div>
      </div>

      {/* Today's Sunnah */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t('spiritual.sunnah.todayTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('spiritual.sunnah.tapToMark')}</p>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {SUNNAH_PRACTICES.map(practice => {
                const done = todayCompleted.has(practice.key);
                return (
                  <button
                    key={practice.key}
                    onClick={() => handleToggle(practice.key)}
                    disabled={togglePractice.isPending}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      done
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    {done && (
                      <div className="absolute top-2 end-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-3xl">{practice.emoji}</span>
                    <span className={cn(
                      'text-sm font-medium text-center',
                      done ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {isRTL ? practice.labelAr : practice.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 30-day Stats */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('spiritual.sunnah.last30')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SUNNAH_PRACTICES.map(practice => {
              const stat = stats.find(s => s.key === practice.key);
              return (
                <div key={practice.key} className="text-center space-y-1 rounded-lg border p-3">
                  <span className="text-xl">{practice.emoji}</span>
                  <p className="text-2xl font-bold">{stat?.count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? practice.labelAr : practice.labelEn}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground italic text-center">
        {totalCompleted >= 20
          ? t('spiritual.sunnah.feedback.excellent')
          : totalCompleted > 0
            ? t('spiritual.sunnah.feedback.good')
            : t('spiritual.sunnah.feedback.encouragement')
        }
      </p>
    </div>
  );
}
