import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import type { RedistributionRecommendation } from '@/features/workload';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  pending: RedistributionRecommendation[];
  isPending: boolean;
  empMap: Record<string, string>;
  updateStatus: UseMutationResult<void, Error, { id: string; status: 'accepted' | 'rejected' }>;
}

export function RedistributionCard({ pending, isPending, empMap, updateStatus }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          {t('executive.smartRedistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-32" /> : pending.length > 0 ? (
          <div className="space-y-3">
            {pending.slice(0, 8).map(rec => (
              <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {empMap[rec.from_employee_id] ?? rec.from_employee_id}
                    {' → '}
                    {empMap[rec.to_employee_id] ?? rec.to_employee_id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{rec.reason}</p>
                  {rec.ai_reasoning && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate italic">{rec.ai_reasoning}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">{rec.priority}</Badge>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateStatus.mutate({ id: rec.id, status: 'accepted' })}
                    disabled={updateStatus.isPending}
                  >
                    <Check className="h-3.5 w-3.5 text-chart-2" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateStatus.mutate({ id: rec.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">{t('executive.noRedistributions')}</p>
        )}
      </CardContent>
    </Card>
  );
}
