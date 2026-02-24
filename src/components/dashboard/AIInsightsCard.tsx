import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, RefreshCw, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { useWellnessInsights, type WellnessInsight } from '@/hooks/analytics/useWellnessInsights';

interface Props {
  analyticsData: any;
  isLoading: boolean;
}

const PRIORITY_STYLES: Record<string, { variant: 'destructive' | 'secondary' | 'outline'; icon: React.ComponentType<any> }> = {
  high: { variant: 'destructive', icon: AlertTriangle },
  medium: { variant: 'secondary', icon: Lightbulb },
  low: { variant: 'outline', icon: TrendingUp },
};

export function AIInsightsCard({ analyticsData, isLoading: parentLoading }: Props) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const { data: insights, isLoading, refetch } = useWellnessInsights(analyticsData, enabled);

  if (parentLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.aiInsights')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {t('orgDashboard.aiInsights')}
          </CardTitle>
          {!enabled ? (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEnabled(true)}>
              {t('orgDashboard.generateInsights')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-3 w-3 me-1 ${isLoading ? 'animate-spin' : ''}`} />
              {t('orgDashboard.refresh')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!enabled ? (
          <div className="text-center py-8">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('orgDashboard.aiInsightsPrompt')}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Executive Summary */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
              <p className="text-sm leading-relaxed">{insights.executiveSummary}</p>
            </div>

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">{t('orgDashboard.recommendations')}</h4>
                {insights.recommendations.map((rec, idx) => {
                  const style = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium;
                  const Icon = style.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded border border-border/30">
                      <Badge variant={style.variant} className="text-[10px] shrink-0 mt-0.5">{rec.priority}</Badge>
                      <div>
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Positive Highlights */}
            {insights.positiveHighlights?.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground">{t('orgDashboard.positiveHighlights')}</h4>
                {insights.positiveHighlights.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-3 w-3 text-chart-2 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('orgDashboard.aiInsightsError')}</p>
        )}
      </CardContent>
    </Card>
  );
}
