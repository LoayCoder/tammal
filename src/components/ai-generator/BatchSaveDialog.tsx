import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Plus, FolderPlus } from 'lucide-react';
import type { QuestionBatch } from '@/hooks/useQuestionBatches';

interface BatchSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBatches: QuestionBatch[];
  questionCount: number;
  maxBatchSize: number;
  onConfirm: (targetBatchId?: string) => void;
  isSaving: boolean;
}

export function BatchSaveDialog({
  open,
  onOpenChange,
  availableBatches,
  questionCount,
  maxBatchSize,
  onConfirm,
  isSaving,
}: BatchSaveDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const selectedBatch = availableBatches.find(b => b.id === selectedBatchId);
  const remainingCapacity = selectedBatch ? maxBatchSize - selectedBatch.question_count : maxBatchSize;
  const willOverflow = mode === 'existing' && selectedBatch && questionCount > remainingCapacity;
  const willOverflowNew = mode === 'new' && questionCount > maxBatchSize;

  const handleConfirm = () => {
    if (mode === 'existing' && selectedBatchId) {
      onConfirm(selectedBatchId);
    } else {
      onConfirm(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('batches.saveTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'new' | 'existing')}>
            <div className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => setMode('new')}>
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer flex items-center gap-2 flex-1">
                <Plus className="h-4 w-4" />
                {t('batches.createNew')}
              </Label>
            </div>

            {availableBatches.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => setMode('existing')}>
                <RadioGroupItem value="existing" id="existing" className="mt-1" />
                <Label htmlFor="existing" className="cursor-pointer flex items-center gap-2 flex-1">
                  <FolderPlus className="h-4 w-4" />
                  {t('batches.addToExisting')}
                </Label>
              </div>
            )}
          </RadioGroup>

          {mode === 'existing' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableBatches.map(batch => (
                <div
                  key={batch.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBatchId === batch.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  <div className="text-sm font-medium truncate">{batch.name || t('batches.unnamed')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {t('batches.questionsCount', { count: batch.question_count })}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t('batches.remaining', { count: maxBatchSize - batch.question_count })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(willOverflow || willOverflowNew) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t('batches.overflowWarning')}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving || (mode === 'existing' && !selectedBatchId)}
          >
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
