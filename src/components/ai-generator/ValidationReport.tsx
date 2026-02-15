import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { ValidationReport as ValidationReportType } from '@/hooks/useEnhancedAIGeneration';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

function extractQuestionIndex(detail: string): number | null {
  const match = detail.match(/^Q(\d+)/i);
  return match ? parseInt(match[1], 10) - 1 : null;
}

function scrollToQuestion(index: number) {
  const el = document.getElementById(`question-card-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
  }
}

export function ValidationReport({ report, isStrictMode }: ValidationReportProps) {
  const { t } = useTranslation();
  const [openChecks, setOpenChecks] = useState<Record<string, boolean>>({});

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

  const toggleCheck = (key: string) => {
    setOpenChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

        <div className="space-y-1">
          {checks.map(check => {
            const result = report.validation_results[check.key];
            if (!result) return null;

            const hasDetails = result.details && (
              (Array.isArray(result.details) && result.details.length > 0) ||
              (typeof result.details === 'string' && result.details.length > 0)
            );
            const isExpandable = hasDetails && result.result !== 'passed';
            const isOpen = openChecks[check.key] || false;

            return (
              <Collapsible key={check.key} open={isOpen} onOpenChange={() => isExpandable && toggleCheck(check.key)}>
                <CollapsibleTrigger asChild disabled={!isExpandable}>
                  <div
                    className={`flex items-center justify-between py-2 px-2 rounded-md border-b last:border-0 ${isExpandable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  >
                    <span className="text-sm">{check.label}</span>
                    <div className="flex items-center gap-2">
                      {resultIcons[result.result]}
                      <span className="text-xs text-muted-foreground capitalize">{result.result}</span>
                      {isExpandable && (
                        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                {isExpandable && (
                  <CollapsibleContent>
                    <div className="ps-3 pe-2 py-2 space-y-1.5 bg-muted/30 rounded-md mb-1">
                      {Array.isArray(result.details) ? (
                        result.details.map((detail: string, idx: number) => {
                          const qIndex = extractQuestionIndex(detail);
                          return (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">{detail}</span>
                              {qIndex !== null && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs shrink-0"
                                  onClick={(e) => { e.stopPropagation(); scrollToQuestion(qIndex); }}
                                >
                                  <ArrowRight className="h-3 w-3 me-1" />
                                  {t('aiGenerator.goToQuestion')}
                                </Button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">{result.details}</span>
                      )}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
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
