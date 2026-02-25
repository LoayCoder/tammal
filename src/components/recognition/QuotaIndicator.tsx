import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface QuotaIndicatorProps {
  used: number;
  total: number;
  teamSize: number;
}

export function QuotaIndicator({ used, total, teamSize }: QuotaIndicatorProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const isExhausted = used >= total;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('recognition.nominations.quota')}
        </span>
        <Badge variant={isExhausted ? 'destructive' : 'secondary'} className="text-xs">
          {used} / {total}
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
      {isExhausted && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>{t('recognition.nominations.quotaExhausted')}</span>
        </div>
      )}
      {teamSize >= 5 && (
        <p className="text-xs text-muted-foreground">
          {t('recognition.nominations.quotaNote', { percent: 30, teamSize })}
        </p>
      )}
    </div>
  );
}
