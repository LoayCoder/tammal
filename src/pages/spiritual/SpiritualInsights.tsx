import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, Sparkles, Moon, BookOpenCheck, UtensilsCrossed, FileText, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { usePrayerLogs } from '@/hooks/spiritual/usePrayerLogs';
import { useQuranSessions } from '@/hooks/spiritual/useQuranSessions';
import { useFastingLogs } from '@/hooks/spiritual/useFastingLogs';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useSpiritualReports, type SpiritualReport } from '@/hooks/spiritual/useSpiritualReports';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, startOfWeek } from 'date-fns';
import { cardVariants, typography} from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface InsightCard {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

function CorrelationCards({ insights }: { insights: InsightCard[] }) {
  const { t } = useTranslation();
  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-chart-1" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (insights.length === 0) {
    return (
      <Card className={cardVariants.glass}>
        <CardContent className="p-8 text-center space-y-2">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className={typography.subtitle}>{t('spiritual.insights.notEnoughData')}</p>
          <p className="text-xs text-muted-foreground">{t('spiritual.insights.notEnoughDataDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight, i) => (
        <Card key={i} className={cn(cardVariants.stat, "rounded-xl")}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <insight.icon className={`h-5 w-5 ${insight.color}`} />
                <span className="text-sm font-medium">{insight.title}</span>
              </div>
              <TrendIcon trend={insight.trend} />
            </div>
            <p className={typography.metric}>{insight.value}</p>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReportCard({ report, onDelete }: { report: SpiritualReport; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const data = report.report_data;

  return (
    <Card className={cardVariants.glass}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {report.report_type === 'weekly' ? t('spiritual.insights.weeklyReport') : t('spiritual.insights.monthlyReport')}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {format(new Date(report.period_start), 'MMM d')} - {format(new Date(report.period_end), 'MMM d')}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('spiritual.insights.deleteReportTitle', 'Delete Report?')}</AlertDialogTitle>
                <AlertDialogDescription>{t('spiritual.insights.deleteReportDesc', 'This will remove this spiritual insight report. This action cannot be undone.')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(report.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('common.delete', 'Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.summary && <p className="text-sm">{data.summary}</p>}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {data.prayerStats && (
            <div className="text-center p-2 rounded-md bg-muted/50">
              <Moon className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{data.prayerStats.consistency}%</p>
              <p className="text-2xs text-muted-foreground">{t('spiritual.insights.prayerConsistency')}</p>
            </div>
          )}
          {data.quranStats && (
            <div className="text-center p-2 rounded-md bg-muted/50">
              <BookOpenCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{data.quranStats.totalMinutes}</p>
              <p className="text-2xs text-muted-foreground">{t('spiritual.insights.quranMinutes')}</p>
            </div>
          )}
          {data.fastingStats && (
            <div className="text-center p-2 rounded-md bg-muted/50">
              <UtensilsCrossed className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{data.fastingStats.completed}</p>
              <p className="text-2xs text-muted-foreground">{t('spiritual.insights.fastsCompleted')}</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">{t('spiritual.insights.recommendations')}</p>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">{t('spiritual.insights.highlightsTitle')}</p>
            <div className="flex flex-wrap gap-1">
              {data.highlights.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.overallScore != null && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{t('spiritual.insights.overallScore')}</span>
            <span className="text-sm font-bold text-primary">{data.overallScore}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SpiritualInsights() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { preferences, isPending: prefsLoading, isEnabled } = useSpiritualPreferences();
  const { employee } = useCurrentEmployee();
  const { reports, isPending: reportsLoading, generateReport, deleteReport } = useSpiritualReports();

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport.mutateAsync(id);
      toast.success(t('spiritual.insights.reportDeleted', 'Report deleted'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);
  const today = new Date().toISOString().split('T')[0];

  const { logs: prayerLogs } = usePrayerLogs({ from: thirtyDaysAgo, to: today });
  const { sessions: quranSessions, totalMinutes: quranMinutes } = useQuranSessions({ from: thirtyDaysAgo, to: today });
  const { logs: fastingLogs } = useFastingLogs({ from: thirtyDaysAgo, to: today });
  const { moodData, avgMood7d } = useMoodHistory(employee?.id ?? null);
  const premiumHighlights = [
    {
      label: 'Mood cadence',
      value: avgMood7d ? `${avgMood7d}/5` : '—',
      description: 'Seven-day emotional rhythm paired with spiritual practices.',
    },
    {
      label: 'Quran minutes',
      value: `${quranMinutes || 0}`,
      description: 'Recent recitation minutes shaping reflection patterns.',
    },
    {
      label: 'Prayer logs',
      value: `${prayerLogs.length}`,
      description: 'Entries available for correlation and insight generation.',
    },
  ];

  // Compute correlations (same as before)
  const insights = useMemo(() => {
    if (!moodData.length) return [];
    const result: InsightCard[] = [];

    if (prayerLogs.length > 0) {
      const prayerDates = new Set(prayerLogs.filter(l => l.status.startsWith('completed')).map(l => l.prayer_date));
      const moodOnPrayerDays = moodData.filter(m => prayerDates.has(m.date));
      const moodOnNonPrayerDays = moodData.filter(m => !prayerDates.has(m.date));
      const avgPrayer = moodOnPrayerDays.length > 0 ? moodOnPrayerDays.reduce((s, m) => s + m.score, 0) / moodOnPrayerDays.length : 0;
      const avgNonPrayer = moodOnNonPrayerDays.length > 0 ? moodOnNonPrayerDays.reduce((s, m) => s + m.score, 0) / moodOnNonPrayerDays.length : 0;
      const diff = avgPrayer - avgNonPrayer;
      if (moodOnPrayerDays.length >= 3) {
        result.push({
          icon: Moon, title: t('spiritual.insights.prayerCorrelation'),
          value: diff > 0 ? `+${(diff * 20).toFixed(0)}%` : `${(diff * 20).toFixed(0)}%`,
          description: diff > 0 ? t('spiritual.insights.prayerPositive') : t('spiritual.insights.prayerNeutral'),
          trend: diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'neutral', color: 'text-primary',
        });
      }
    }

    if (quranSessions.length > 0) {
      const quranDates = new Set(quranSessions.map(s => s.session_date));
      const moodOnQuranDays = moodData.filter(m => quranDates.has(m.date));
      const moodOnNonQuranDays = moodData.filter(m => !quranDates.has(m.date));
      const avgQuran = moodOnQuranDays.length > 0 ? moodOnQuranDays.reduce((s, m) => s + m.score, 0) / moodOnQuranDays.length : 0;
      const avgNonQuran = moodOnNonQuranDays.length > 0 ? moodOnNonQuranDays.reduce((s, m) => s + m.score, 0) / moodOnNonQuranDays.length : 0;
      const diff = avgQuran - avgNonQuran;
      if (moodOnQuranDays.length >= 2) {
        result.push({
          icon: BookOpenCheck, title: t('spiritual.insights.quranCorrelation'),
          value: diff > 0 ? `+${(diff * 20).toFixed(0)}%` : `${(diff * 20).toFixed(0)}%`,
          description: diff > 0 ? t('spiritual.insights.quranPositive', { minutes: Math.round(quranMinutes / quranSessions.length) }) : t('spiritual.insights.quranNeutral'),
          trend: diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'neutral', color: 'text-primary',
        });
      }
    }

    if (fastingLogs.length > 0) {
      const fastDates = new Set(fastingLogs.filter(l => l.completed).map(l => l.fast_date));
      const moodOnFastDays = moodData.filter(m => fastDates.has(m.date));
      const moodOnNonFastDays = moodData.filter(m => !fastDates.has(m.date));
      const avgFast = moodOnFastDays.length > 0 ? moodOnFastDays.reduce((s, m) => s + m.score, 0) / moodOnFastDays.length : 0;
      const avgNonFast = moodOnNonFastDays.length > 0 ? moodOnNonFastDays.reduce((s, m) => s + m.score, 0) / moodOnNonFastDays.length : 0;
      const diff = avgFast - avgNonFast;
      if (moodOnFastDays.length >= 2) {
        result.push({
          icon: UtensilsCrossed, title: t('spiritual.insights.fastingCorrelation'),
          value: diff > 0 ? `+${(diff * 20).toFixed(0)}%` : `${(diff * 20).toFixed(0)}%`,
          description: diff > 0 ? t('spiritual.insights.fastingPositive') : t('spiritual.insights.fastingNeutral'),
          trend: diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'neutral', color: 'text-primary',
        });
      }
    }

    return result;
  }, [prayerLogs, quranSessions, fastingLogs, moodData, quranMinutes, t]);

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    const periodEnd = today;
    const periodStart = type === 'weekly'
      ? format(subDays(new Date(), 7), 'yyyy-MM-dd')
      : format(startOfMonth(new Date()), 'yyyy-MM-dd');

    try {
      await generateReport.mutateAsync({ reportType: type, periodStart, periodEnd });
      toast.success(t('spiritual.insights.reportGenerated'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (prefsLoading) {
    return <div className="container mx-auto py-6 space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  if (!isEnabled) {
    return (
      <div className="container mx-auto py-6">
        <Card className="rounded-[28px] border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(23,32,51,0.92),rgba(17,24,39,0.94))]">
          <CardContent className="p-12 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.insights.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.insights.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[rgba(148,163,184,0.14)] bg-[linear-gradient(180deg,rgba(23,32,51,0.92),rgba(11,16,32,0.96))] p-6 shadow-[var(--shadow-sm)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_28%)]" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(20,184,166,0.14)] text-[var(--brand-primary)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Reflective analytics</p>
              <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">{t('spiritual.insights.title')}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{t('spiritual.insights.subtitle')}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {premiumHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)] p-4 backdrop-blur">
                <p className={typography.statLabel}>{item.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card className="rounded-2xl border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)]">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="text-4xl font-bold tracking-[-0.03em] text-[var(--brand-primary)]">{avgMood7d || '—'}</div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{t('spiritual.insights.currentMood')}</p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{t('spiritual.insights.sevenDayAvg')}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="correlations" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)] p-2">
          <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(20,184,166,0.18)] data-[state=active]:bg-[rgba(20,184,166,0.12)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none" value="correlations">{t('spiritual.insights.correlationsTab')}</TabsTrigger>
          <TabsTrigger className="rounded-xl border border-transparent px-4 data-[state=active]:border-[rgba(20,184,166,0.18)] data-[state=active]:bg-[rgba(20,184,166,0.12)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none" value="reports">{t('spiritual.insights.reportsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="correlations">
          <CorrelationCards insights={insights} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)]"
              onClick={() => handleGenerateReport('weekly')}
              disabled={generateReport.isPending}
            >
              {generateReport.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <RefreshCw className="h-4 w-4 me-2" />}
              {t('spiritual.insights.generateWeekly')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)]"
              onClick={() => handleGenerateReport('monthly')}
              disabled={generateReport.isPending}
            >
              {generateReport.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <RefreshCw className="h-4 w-4 me-2" />}
              {t('spiritual.insights.generateMonthly')}
            </Button>
          </div>

          {reportsLoading ? (
            <Skeleton className="h-48" />
          ) : reports.length === 0 ? (
            <Card className="rounded-2xl border-[rgba(148,163,184,0.14)] bg-[rgba(23,32,51,0.78)]">
              <CardContent className="p-8 text-center space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className={typography.subtitle}>{t('spiritual.insights.noReports')}</p>
                <p className="text-xs text-muted-foreground">{t('spiritual.insights.noReportsDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} onDelete={handleDeleteReport} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground italic text-center">
        {t('spiritual.insights.privacyNote')}
      </p>
    </div>
  );
}
