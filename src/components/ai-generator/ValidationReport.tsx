import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ValidationReport as ValidationReportType } from '@/hooks/useEnhancedAIGeneration';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidationReportProps {
  report: ValidationReportType;
  isStrictMode: boolean;
}

const resultIcons: Record<string, React.ReactNode> = {
  passed: <CheckCircle className="h-4 w-4 text-primary" />,
  warning: <AlertTriangle className="h-4 w-4 text-chart-4" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
};

const resultBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  passed: 'default',
  warning: 'outline',
  failed: 'destructive',
};

export function ValidationReport({ report, isStrictMode }: ValidationReportProps) {
  const { t } = useTranslation();

  const checks = [
    { key: 'structure', label: t('aiGenerator.checkStructure') },
    { key: 'duplicates', label: t('aiGenerator.checkDuplicates') },
    { key: 'bias', label: t('aiGenerator.checkBias') },
    { key: 'ambiguity', label: t('aiGenerator.checkAmbiguity') },
    { key: 'length', label: t('aiGenerator.checkLength') },
    { key: 'confidence', label: t('aiGenerator.checkConfidence') },
    { key: 'critic', label: t('aiGenerator.checkCritic') },
  ];

  const hasFailures = report.overall_result === 'failed';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{t('aiGenerator.validationReport')}</span>
          <Badge variant={resultBadgeVariant[report.overall_result] || 'outline'}>
            {report.overall_result === 'passed' ? t('aiGenerator.allPassed') :
              report.overall_result === 'warning' ? t('aiGenerator.hasWarnings') :
                t('aiGenerator.hasFailed')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isStrictMode && hasFailures && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{t('aiGenerator.strictModeBlocked')}</AlertTitle>
            <AlertDescription>{t('aiGenerator.strictModeMessage')}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {checks.map(check => {
            const result = report.validation_results[check.key];
            if (!result) return null;
            return (
              <div key={check.key} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm">{check.label}</span>
                <div className="flex items-center gap-2">
                  {resultIcons[result.result]}
                  <span className="text-xs text-muted-foreground capitalize">{result.result}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">{t('aiGenerator.avgConfidence')}</span>
          <Badge variant="outline">{report.avg_confidence}%</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
