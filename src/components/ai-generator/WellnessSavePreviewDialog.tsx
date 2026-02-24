import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Heart, Package, Plus } from 'lucide-react';
import type { QuestionBatch } from '@/hooks/questions/useQuestionBatches';

const MOOD_META: Record<string, { emoji: string; labelKey: string }> = {
  great: { emoji: '😄', labelKey: 'checkin.moodGreat' },
  good: { emoji: '🙂', labelKey: 'checkin.moodGood' },
  okay: { emoji: '😐', labelKey: 'checkin.moodOkay' },
  struggling: { emoji: '😟', labelKey: 'checkin.moodStruggling' },
  need_help: { emoji: '😢', labelKey: 'checkin.moodNeedHelp' },
};

interface WellnessQuestion {
  question_text: string;
  question_text_ar?: string;
  type: string;
  mood_levels?: string[];
}

interface WellnessSavePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: WellnessQuestion[];
  onConfirm: (targetBatchId?: string) => void;
  isSaving: boolean;
  availableBatches: QuestionBatch[];
  maxBatchSize: number;
}

export function WellnessSavePreviewDialog({
  open, onOpenChange, questions, onConfirm, isSaving, availableBatches, maxBatchSize,
}: WellnessSavePreviewDialogProps) {
  const { t } = useTranslation();
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const questionsWithoutMoods = questions.filter(
    q => !q.mood_levels || q.mood_levels.length === 0
  );

  const handleConfirm = () => {
    onConfirm(saveMode === 'existing' && selectedBatchId ? selectedBatchId : undefined);
  };

  // Reset state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSaveMode(availableBatches.length > 0 ? 'existing' : 'new');
      setSelectedBatchId(availableBatches.length > 0 ? availableBatches[0].id : null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t('aiGenerator.wellnessPreviewTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('aiGenerator.wellnessPreviewDesc', { count: questions.length })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>{t('aiGenerator.questionText')}</TableHead>
                <TableHead className="w-12">{t('aiGenerator.questionType')}</TableHead>
                <TableHead className="min-w-[140px]">{t('aiGenerator.moodTags')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2">{q.question_text}</p>
                    {q.question_text_ar && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1" dir="rtl">
                        {q.question_text_ar}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{q.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {q.mood_levels && q.mood_levels.length > 0 ? (
                        q.mood_levels.map(level => {
                          const meta = MOOD_META[level];
                          return (
                            <Badge key={level} variant="secondary" className="text-xs gap-1">
                              {meta?.emoji ?? '•'} {meta ? t(meta.labelKey) : level}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t('aiGenerator.noMoodTags')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {questionsWithoutMoods.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('aiGenerator.wellnessPreviewWarning', { count: questionsWithoutMoods.length })}
          </p>
        )}

        {/* Batch selection */}
        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">{t('aiGenerator.wellnessBatchTarget')}</p>
          <RadioGroup
            value={saveMode}
            onValueChange={(v) => {
              setSaveMode(v as 'new' | 'existing');
              if (v === 'new') setSelectedBatchId(null);
              else if (availableBatches.length > 0) setSelectedBatchId(availableBatches[0].id);
            }}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="new" id="batch-new" />
              <Label htmlFor="batch-new" className="flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                {t('aiGenerator.wellnessBatchNew')}
              </Label>
            </div>

            {availableBatches.length > 0 && (
              <div className="flex items-start gap-2">
                <RadioGroupItem value="existing" id="batch-existing" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="batch-existing" className="flex items-center gap-1.5 cursor-pointer">
                    <Package className="h-3.5 w-3.5" />
                    {t('aiGenerator.wellnessBatchExisting')}
                  </Label>

                  {saveMode === 'existing' && (
                    <div className="mt-2 space-y-1.5 ps-1">
                      {availableBatches.map(batch => {
                        const remaining = maxBatchSize - batch.question_count;
                        const isSelected = selectedBatchId === batch.id;
                        return (
                          <button
                            key={batch.id}
                            type="button"
                            onClick={() => setSelectedBatchId(batch.id)}
                            className={`w-full text-start p-2 rounded-md border text-sm transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">
                                {batch.creator_name || t('aiGenerator.wellnessBatchUnnamed')}
                              </span>
                              <Badge variant="outline" className="text-xs shrink-0 ms-2">
                                {batch.question_count}/{maxBatchSize}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t('aiGenerator.wellnessBatchRemaining', { count: remaining })}
                              {questions.length > remaining && (
                                <span className="text-amber-600 dark:text-amber-400 ms-1">
                                  — {t('aiGenerator.wellnessBatchOverflow', { count: questions.length - remaining })}
                                </span>
                              )}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving || (saveMode === 'existing' && !selectedBatchId)}>
            {isSaving ? t('common.loading') : t('aiGenerator.confirmWellnessSave', { count: questions.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
