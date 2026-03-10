import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { BatchQuestion } from '@/hooks/questions/useQuestionBatches';

interface QuestionDetailDialogProps {
  question: BatchQuestion | null;
  onClose: () => void;
  statusColor: (status: string) => string;
  statusLabel: (status: string) => string;
  typeLabel: (type: string) => string;
}

export function QuestionDetailDialog({ question, onClose, statusColor, statusLabel, typeLabel }: QuestionDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!question} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('questions.questionDetails')}</DialogTitle>
          <DialogDescription>{t('questions.viewQuestion')}</DialogDescription>
        </DialogHeader>

        {question && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('batches.questionText')}</p>
              <p className="text-sm bg-muted/50 rounded-md p-3">{question.question_text}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('batches.questionTextAr')}</p>
              <p className="text-sm bg-muted/50 rounded-md p-3" dir="rtl">
                {question.question_text_ar || '—'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('batches.type')}:</span>
                <Badge variant="outline">{typeLabel(question.type)}</Badge>
              </div>
              {question.confidence_score != null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('batches.confidence')}:</span>
                  <Badge variant="outline">{question.confidence_score}%</Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.status')}:</span>
                <Badge variant="outline" className={statusColor(question.validation_status || 'pending')}>
                  {statusLabel(question.validation_status || 'pending')}
                </Badge>
              </div>
            </div>

            {question.options && Array.isArray(question.options) && question.options.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('questions.options')}</p>
                <ol className="list-decimal list-inside space-y-1 bg-muted/50 rounded-md p-3">
                  {question.options.map((opt: any, i: number) => (
                    <li key={i} className="text-sm">{typeof opt === 'string' ? opt : JSON.stringify(opt)}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
