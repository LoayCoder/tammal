import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Heart } from 'lucide-react';

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
  onConfirm: () => void;
  isSaving: boolean;
}

export function WellnessSavePreviewDialog({
  open, onOpenChange, questions, onConfirm, isSaving,
}: WellnessSavePreviewDialogProps) {
  const { t } = useTranslation();

  const questionsWithoutMoods = questions.filter(
    q => !q.mood_levels || q.mood_levels.length === 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <ScrollArea className="max-h-[400px]">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? t('common.loading') : t('aiGenerator.confirmWellnessSave', { count: questions.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
