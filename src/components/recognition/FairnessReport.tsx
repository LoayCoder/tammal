import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, Eye } from 'lucide-react';

interface FairnessReportProps {
  report: Record<string, any>;
}

export function FairnessReport({ report }: FairnessReportProps) {
  const { t } = useTranslation();
  const cliques = report.clique_warnings || [];
  const anomalies = report.anomalies || [];
  const parity = report.demographic_parity || {};
  const visibility = report.visibility_correction || {};

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
        <CardContent>
          <Badge variant="secondary">{parity.status || 'N/A'}</Badge>
          {parity.note && <p className="text-xs text-muted-foreground mt-2">{parity.note}</p>}
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
