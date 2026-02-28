import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { UtensilsCrossed, TrendingUp, Calendar, Zap, Check, X } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useFastingLogs, FAST_TYPES } from '@/hooks/spiritual/useFastingLogs';
import { useNavigate } from 'react-router-dom';

export default function SunnahFasting() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { preferences, isLoading: prefsLoading } = useSpiritualPreferences();

  const isActive = preferences?.enabled && preferences?.fasting_enabled;

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const { logs, isLoading, logFast, todayLog, completedCount } = useFastingLogs({ from: thirtyDaysAgo, to: today });

  // Check-in form state
  const [fastType, setFastType] = useState('voluntary');
  const [energy, setEnergy] = useState([3]);
  const [notes, setNotes] = useState('');

  // Determine today's suggested fast type
  const todayDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, 4=Thu
  const suggestedType = todayDayOfWeek === 1 ? 'monday' : todayDayOfWeek === 4 ? 'thursday' : null;

  const handleLogFast = (completed: boolean) => {
    logFast.mutate({
      fast_date: today,
      fast_type: fastType,
      completed,
      energy_rating: energy[0],
      notes: notes || undefined,
    });
    setNotes('');
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
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.fasting.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.fasting.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('spiritual.fasting.title')}</h1>
          <p className="text-muted-foreground">{t('spiritual.fasting.subtitle')}</p>
        </div>
      </div>

      {/* Suggestion banner */}
      {suggestedType && !todayLog && (
        <Card className="glass-card border-0 rounded-xl border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="text-sm">
              {t('spiritual.fasting.suggestion', {
                day: isRTL
                  ? FAST_TYPES.find(f => f.key === suggestedType)?.labelAr
                  : FAST_TYPES.find(f => f.key === suggestedType)?.labelEn
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">{t('spiritual.fasting.completedFasts')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">{t('spiritual.fasting.totalDays')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {logs.filter(l => l.energy_rating).length > 0
                  ? (logs.filter(l => l.energy_rating).reduce((sum, l) => sum + (l.energy_rating ?? 0), 0) / logs.filter(l => l.energy_rating).length).toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{t('spiritual.fasting.avgEnergy')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's check-in */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t('spiritual.fasting.todayCheckin')}</CardTitle>
          <CardDescription>
            {todayLog
              ? t('spiritual.fasting.alreadyLogged')
              : t('spiritual.fasting.areYouFasting')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayLog ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={todayLog.completed ? 'default' : 'secondary'}>
                  {todayLog.completed ? t('spiritual.fasting.completed') : t('spiritual.fasting.notFasting')}
                </Badge>
                <Badge variant="outline">
                  {isRTL
                    ? FAST_TYPES.find(f => f.key === todayLog.fast_type)?.labelAr ?? todayLog.fast_type
                    : FAST_TYPES.find(f => f.key === todayLog.fast_type)?.labelEn ?? todayLog.fast_type}
                </Badge>
                {todayLog.energy_rating && (
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {todayLog.energy_rating}/5
                  </Badge>
                )}
              </div>
              {todayLog.notes && <p className="text-sm text-muted-foreground italic">"{todayLog.notes}"</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('spiritual.fasting.fastType')}</Label>
                <Select value={fastType} onValueChange={setFastType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAST_TYPES.map(ft => (
                      <SelectItem key={ft.key} value={ft.key}>
                        {isRTL ? ft.labelAr : ft.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('spiritual.fasting.energyLevel')} ({energy[0]}/5)</Label>
                <Slider value={energy} onValueChange={setEnergy} min={1} max={5} step={1} />
              </div>

              <div className="space-y-2">
                <Label>{t('spiritual.fasting.notes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('spiritual.fasting.notesPlaceholder')}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleLogFast(true)} disabled={logFast.isPending} className="gap-2">
                  <Check className="h-4 w-4" />
                  {t('spiritual.fasting.yesFasting')}
                </Button>
                <Button variant="outline" onClick={() => handleLogFast(false)} disabled={logFast.isPending} className="gap-2">
                  <X className="h-4 w-4" />
                  {t('spiritual.fasting.notToday')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t('spiritual.fasting.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('spiritual.fasting.noLogs')}</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {log.completed ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {isRTL
                          ? FAST_TYPES.find(f => f.key === log.fast_type)?.labelAr ?? log.fast_type
                          : FAST_TYPES.find(f => f.key === log.fast_type)?.labelEn ?? log.fast_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.fast_date}</p>
                    </div>
                  </div>
                  {log.energy_rating && (
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {log.energy_rating}/5
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground italic text-center">
        {completedCount >= 8
          ? t('spiritual.fasting.feedback.excellent')
          : completedCount > 0
            ? t('spiritual.fasting.feedback.good')
            : t('spiritual.fasting.feedback.encouragement')
        }
      </p>
    </div>
  );
}
