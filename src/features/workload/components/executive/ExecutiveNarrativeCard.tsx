import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/theme/tokens';

interface Props {
  tammalScore: number;
  components: {
    alignment: number;
    velocity: number;
    capacity_balance: number;
    burnout_health: number;
  } | null;
  burnoutRiskCount: number;
  isPending: boolean;
}

function generateNarrative(
  t: (key: string, params?: Record<string, unknown>) => string,
  score: number,
  components: Props['components'],
  burnoutRiskCount: number,
): { message: string; severity: 'success' | 'warning' | 'danger' } {
  if (!components) {
    return { message: t('executive.narrative.noData'), severity: 'warning' };
  }

  const weakest = Object.entries(components).sort((a, b) => a[1] - b[1])[0];
  const strongest = Object.entries(components).sort((a, b) => b[1] - a[1])[0];

  if (score >= 75) {
    return {
      message: t('executive.narrative.healthy', {
        score,
        strongest: t(`executive.tammal.${strongest[0]}`),
        strongestVal: strongest[1],
      }),
      severity: 'success',
    };
  }

  if (score >= 50) {
    return {
      message: t('executive.narrative.attention', {
        score,
        weakest: t(`executive.tammal.${weakest[0]}`),
        weakestVal: weakest[1],
        burnoutCount: burnoutRiskCount,
      }),
      severity: 'warning',
    };
  }

  return {
    message: t('executive.narrative.critical', {
      score,
      weakest: t(`executive.tammal.${weakest[0]}`),
      weakestVal: weakest[1],
      burnoutCount: burnoutRiskCount,
    }),
    severity: 'danger',
  };
}

const SEVERITY_STYLES = {
  success: 'border-chart-2/30 bg-chart-2/5',
  warning: 'border-chart-5/30 bg-chart-5/5',
  danger: 'border-destructive/30 bg-destructive/5',
};

const SEVERITY_ICON = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

const SEVERITY_ICON_COLOR = {
  success: 'text-chart-2',
  warning: 'text-chart-5',
  danger: 'text-destructive',
};

export function ExecutiveNarrativeCard({ tammalScore, components, burnoutRiskCount, isPending }: Props) {
  const { t } = useTranslation();

  if (isPending) return <Skeleton className="h-20 rounded-xl" />;

  const { message, severity } = generateNarrative(t, tammalScore, components, burnoutRiskCount);
  const Icon = SEVERITY_ICON[severity];

  return (
    <Card className={cn(cardVariants.glass, 'border', SEVERITY_STYLES[severity])}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 shrink-0 ${SEVERITY_ICON_COLOR[severity]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">{t('executive.narrative.title')}</span>
          </div>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
