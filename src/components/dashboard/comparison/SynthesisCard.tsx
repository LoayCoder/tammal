import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Brain, Shield, Target, Gauge, Lightbulb } from 'lucide-react';
import type { SynthesisResult } from '@/lib/synthesisEngine';

interface Props {
  data: SynthesisResult | null;
  isLoading: boolean;
}

const RISK_COLORS: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  orange: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  red: 'bg-destructive/15 text-destructive border-destructive/30',
};

export function SynthesisCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('synthesis.title')}</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const riskColor = RISK_COLORS[data.riskClassification] ?? RISK_COLORS.green;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          {t('synthesis.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('synthesis.titleDesc')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* BAI Score */}
          <div className="text-center space-y-1">
            <Target className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold">{(data.baiScore * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{t('synthesis.baiScore')}</p>
          </div>

          {/* Divergence Level */}
          <div className="text-center space-y-1">
            <Shield className="h-5 w-5 mx-auto text-primary" />
            <Badge variant="outline" className={`${riskColor} text-xs`}>
              {t(`synthesis.divergence.${data.divergenceLevel}`)}
            </Badge>
            <p className="text-xs text-muted-foreground">{t('synthesis.divergenceLevel')}</p>
          </div>

          {/* Risk Classification */}
          <div className="text-center space-y-1">
            <div className={`h-5 w-5 mx-auto rounded-full border-2 ${riskColor}`} />
            <p className="text-sm font-semibold capitalize">{t(`synthesis.risk.${data.riskClassification}`)}</p>
            <p className="text-xs text-muted-foreground">{t('synthesis.riskLevel')}</p>
          </div>

          {/* Confidence */}
          <div className="text-center space-y-1">
            <Gauge className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold">{data.confidenceScore}%</p>
            <p className="text-xs text-muted-foreground">{t('synthesis.confidence')}</p>
          </div>

          {/* Action */}
          <div className="text-center space-y-1 col-span-2 md:col-span-1">
            <Lightbulb className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs font-medium">{t(data.recommendedActionKey)}</p>
            <p className="text-xs text-muted-foreground">{t('synthesis.action')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
