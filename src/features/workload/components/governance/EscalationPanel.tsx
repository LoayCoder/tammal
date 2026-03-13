import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { EscalationTimeline } from './EscalationTimeline';
import { SlaBadge } from './SlaBadge';
import { AlertTriangle } from 'lucide-react';

interface Props {
  taskId: string;
  taskTitle: string;
  dueDate: string | null;
  completedAt?: string | null;
}

export function EscalationPanel({ taskId, taskTitle, dueDate, completedAt }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="border-0 glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            {t('governance.escalation.title')}
          </CardTitle>
          <SlaBadge dueDate={dueDate} completedAt={completedAt} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{taskTitle}</p>
      </CardHeader>
      <CardContent>
        <EscalationTimeline taskId={taskId} />
      </CardContent>
    </Card>
  );
}
