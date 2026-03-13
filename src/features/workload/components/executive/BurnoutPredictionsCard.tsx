import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Brain } from 'lucide-react';
import type { BurnoutPrediction } from '@/features/workload';

interface Props {
  predictions: BurnoutPrediction[];
  isPending: boolean;
  empMap: Record<string, string>;
}

export function BurnoutPredictionsCard({ predictions, isPending, empMap }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-destructive" />
          {t('executive.aiBurnoutPredictions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-32" /> : predictions.length > 0 ? (
          <TooltipProvider>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {predictions
                .sort((a, b) => b.burnout_probability_score - a.burnout_probability_score)
                .slice(0, 9)
                .map(pred => (
                  <Tooltip key={pred.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 cursor-help">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {empMap[pred.employee_id] ?? pred.employee_id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={pred.burnout_probability_score} className="h-1.5 flex-1" />
                            <span className="text-xs font-semibold">{Math.round(pred.burnout_probability_score)}%</span>
                          </div>
                        </div>
                        <Badge
                          variant={pred.burnout_probability_score > 60 ? 'destructive' : 'secondary'}
                          className="text-xs shrink-0"
                        >
                          {pred.confidence_score ? `${Math.round(pred.confidence_score)}% ${t('executive.confidence')}` : t('executive.aiPredicted')}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{pred.ai_reasoning ?? t('executive.noAIReasoning')}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
          </TooltipProvider>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">{t('executive.noBurnoutPredictions')}</p>
        )}
      </CardContent>
    </Card>
  );
}
