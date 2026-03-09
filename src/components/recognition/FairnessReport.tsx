import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, Eye, TrendingDown, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FairnessReportProps {
  report: Record<string, any>;
}

export function FairnessReport({ report }: FairnessReportProps) {
  const { t } = useTranslation();
  const cliques = report.clique_warnings || [];
  const anomalies = report.anomalies || [];
  const parity = report.demographic_parity || {};
  const visibility = report.visibility_correction || {};

  const parityStatusVariant = parity.status === 'balanced'
    ? 'secondary' as const
    : parity.status === 'imbalanced'
      ? 'destructive' as const
      : 'outline' as const;

  const parityStatusLabel = parity.status === 'balanced'
    ? t('recognition.results.parityBalanced')
    : parity.status === 'imbalanced'
      ? t('recognition.results.parityImbalanced')
      : parity.status === 'insufficient_data'
        ? t('recognition.results.insufficientData')
        : parity.status || 'N/A';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Clique Detection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {t('recognition.results.cliqueDetection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cliques.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-chart-2" />
              {t('recognition.results.noCliques')}
            </div>
          ) : (
            <div className="space-y-2">
              {cliques.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>{t('recognition.results.cliqueWarning', { count: c.mutual_count })}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vote Anomalies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            {t('recognition.results.voteAnomalies')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-chart-2" />
              {t('recognition.results.noAnomalies')}
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">{a.type}</Badge>
                  <span>{t('recognition.results.anomalyCount', { count: a.count })}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demographic Parity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {t('recognition.results.demographicParity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={parityStatusVariant}>{parityStatusLabel}</Badge>

          {parity.score != null && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {t('recognition.results.parityScore', { score: parity.score, target: parity.target })}
              </p>
              <Progress value={parity.score * 100} className="h-2" />
            </div>
          )}

          {parity.underrepresented?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                {t('recognition.results.underrepresented')}
              </p>
              <div className="flex flex-wrap gap-1">
                {parity.underrepresented.map((d: string) => (
                  <Badge key={d} variant="outline" className="text-2xs">{d}</Badge>
                ))}
              </div>
            </div>
          )}

          {parity.overrepresented?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-chart-4" />
                {t('recognition.results.overrepresented')}
              </p>
              <div className="flex flex-wrap gap-1">
                {parity.overrepresented.map((d: string) => (
                  <Badge key={d} variant="outline" className="text-2xs">{d}</Badge>
                ))}
              </div>
            </div>
          )}

          {parity.status === 'insufficient_data' && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {parity.department_count != null
                  ? t('recognition.results.parityDeptCount', { count: parity.department_count, required: 2 })
                  : parity.note}
              </p>
              {parity.nominee_count != null && (
                <p className="text-xs text-muted-foreground">
                  {t('recognition.results.parityNomineeCount', { count: parity.nominee_count })}
                </p>
              )}
            </div>
          )}
          {parity.note && !parity.score && parity.status !== 'insufficient_data' && (
            <p className="text-xs text-muted-foreground">{parity.note}</p>
          )}
        </CardContent>
      </Card>

      {/* Visibility Bias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {t('recognition.results.visibilityBias')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibility.applied ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-chart-2" />
              <span>{t('recognition.results.correctionApplied')}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t('recognition.results.noCorrectionNeeded')}</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
