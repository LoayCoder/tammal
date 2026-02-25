import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface VotingProgressProps {
  completed: number;
  total: number;
  currentIndex: number;
}

export function VotingProgress({ completed, total, currentIndex }: VotingProgressProps) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('recognition.voting.progress', { current: currentIndex + 1, total })}
        </span>
        <span className="font-medium">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
