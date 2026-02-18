import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Tag } from 'lucide-react';
import { useQuestions, Question } from '@/hooks/useQuestions';
import { useQuestionCategories } from '@/hooks/useQuestionCategories';

const MOOD_META: Record<string, { emoji: string; label: string; label_ar: string }> = {
  great: { emoji: '😄', label: 'Great', label_ar: 'ممتاز' },
  good: { emoji: '🙂', label: 'Good', label_ar: 'جيد' },
  okay: { emoji: '😐', label: 'Okay', label_ar: 'عادي' },
  struggling: { emoji: '😟', label: 'Struggling', label_ar: 'أعاني' },
  need_help: { emoji: '😢', label: 'Need Help', label_ar: 'بحاجة للمساعدة' },
};

interface MoodQuestionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moodLevel: string;
  onSave: (questionIds: string[], moodLevel: string) => Promise<void>;
  isSaving?: boolean;
}

export function MoodQuestionPickerDialog({
  open,
  onOpenChange,
  moodLevel,
  onSave,
  isSaving,
}: MoodQuestionPickerDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { questions, isLoading } = useQuestions();
  const { categories } = useQuestionCategories();

  const moodMeta = MOOD_META[moodLevel];

  // Questions currently tagged for this mood
  const taggedIds = useMemo(() => {
    return questions
      .filter(q => {
        const levels = (q as any).mood_levels;
        return Array.isArray(levels) && levels.includes(moodLevel);
      })
      .map(q => q.id);
  }, [questions, moodLevel]);

  const [localSelected, setLocalSelected] = useState<Set<string>>(() => new Set(taggedIds));

  // Sync when dialog opens or taggedIds change
  useMemo(() => {
    if (open) setLocalSelected(new Set(taggedIds));
  }, [open, taggedIds.join(',')]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (categoryFilter !== 'all' && q.category_id !== categoryFilter) return false;
      const text = isRTL && q.text_ar ? q.text_ar : q.text;
      if (search && !text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [questions, categoryFilter, search, isRTL]);

  const toggle = (id: string) => {
    setLocalSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await onSave(Array.from(localSelected), moodLevel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <DialogTitle>
              {t('moodPathway.browseQuestions')}
              {moodMeta && <span className="ms-1">{moodMeta.emoji}</span>}
            </DialogTitle>
            <span className="text-xs border rounded-full px-2 py-0.5 text-muted-foreground">
              {moodMeta && (isRTL ? moodMeta.label_ar : moodMeta.label)}
            </span>
          </div>
          <DialogDescription>
            {t('moodPathway.browseQuestionsDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('questions.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || '#3B82F6' }} />
                    {isRTL && cat.name_ar ? cat.name_ar : cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question list */}
        <ScrollArea className="flex-1 p-4 min-h-[300px] max-h-[420px]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {t('common.noData')}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((q: Question) => {
                const isChecked = localSelected.has(q.id);
                const text = isRTL && q.text_ar ? q.text_ar : q.text;
                return (
                  <label
                    key={q.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggle(q.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug line-clamp-2" dir="auto">{text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {q.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {isRTL && q.category.name_ar ? q.category.name_ar : q.category.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {t(`questions.types.${q.type}`)}
                        </Badge>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <span className="text-sm text-muted-foreground me-auto">
            {localSelected.size} {t('common.selected')}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
