import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';

const COLOR_OPTIONS = [
  { value: 'text-chart-1', label: 'Green', dot: 'bg-chart-1' },
  { value: 'text-chart-2', label: 'Blue', dot: 'bg-chart-2' },
  { value: 'text-chart-3', label: 'Purple', dot: 'bg-chart-3' },
  { value: 'text-chart-4', label: 'Yellow', dot: 'bg-chart-4' },
  { value: 'text-chart-5', label: 'Pink', dot: 'bg-chart-5' },
  { value: 'text-destructive', label: 'Red', dot: 'bg-destructive' },
  { value: 'text-primary', label: 'Primary', dot: 'bg-primary' },
  { value: 'text-muted-foreground', label: 'Gray', dot: 'bg-muted-foreground' },
  { value: 'text-orange-500', label: 'Orange', dot: 'bg-orange-500' },
  { value: 'text-teal-500', label: 'Teal', dot: 'bg-teal-500' },
  { value: 'text-indigo-500', label: 'Indigo', dot: 'bg-indigo-500' },
  { value: 'text-rose-500', label: 'Rose', dot: 'bg-rose-500' },
  { value: 'text-emerald-500', label: 'Emerald', dot: 'bg-emerald-500' },
  { value: 'text-amber-500', label: 'Amber', dot: 'bg-amber-500' },
];

const EMOJI_SUGGESTIONS = ['😄', '🙂', '😐', '😟', '😢', '😊', '🤩', '😔', '😰', '💪', '🧘', '😴', '🤔', '😤', '🥺'];

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface MoodDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mood: MoodDefinition | null;
  onSave: (data: Partial<MoodDefinition>) => void;
  isSaving: boolean;
  existingKeys: string[];
  existingMoods?: MoodDefinition[];
}

export function MoodDefinitionDialog({
  open, onOpenChange, mood, onSave, isSaving, existingKeys, existingMoods = [],
}: MoodDefinitionDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!mood;

  const [key, setKey] = useState('');
  const [emoji, setEmoji] = useState('😐');
  const [labelEn, setLabelEn] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [color, setColor] = useState('text-chart-1');
  const [score, setScore] = useState(3);

  useEffect(() => {
    if (mood) {
      setKey(mood.key);
      setEmoji(mood.emoji);
      setLabelEn(mood.label_en);
      setLabelAr(mood.label_ar);
      setColor(mood.color);
      setScore(mood.score);
    } else {
      setKey('');
      setEmoji('😐');
      setLabelEn('');
      setLabelAr('');
      setColor('text-chart-1');
      setScore(3);
    }
  }, [mood, open]);

  // Compute taken values (exclude current mood when editing)
  const otherMoods = existingMoods.filter(m => !mood || m.id !== mood.id);
  const takenEmojis = new Set(otherMoods.map(m => m.emoji));
  const takenScores = new Set(otherMoods.map(m => m.score));
  const takenColors = new Set(otherMoods.map(m => m.color));

  const generatedKey = key || labelEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const keyConflict = !isEdit && existingKeys.includes(generatedKey);
  const isEmojiConflict = takenEmojis.has(emoji) && emoji !== mood?.emoji;
  const isScoreConflict = takenScores.has(score) && score !== mood?.score;
  const isColorConflict = takenColors.has(color) && color !== mood?.color;
  const canSave = labelEn.trim() && labelAr.trim() && emoji && !keyConflict && !isEmojiConflict && !isScoreConflict && !isColorConflict;

  const handleSave = () => {
    onSave({
      ...(mood ? { id: mood.id } : {}),
      key: generatedKey,
      emoji,
      label_en: labelEn.trim(),
      label_ar: labelAr.trim(),
      color,
      score,
    });
  };

  // Available emojis: not taken by other moods
  const availableEmojis = EMOJI_SUGGESTIONS.filter(e => !takenEmojis.has(e));
  // Available scores: not taken by other moods
  const availableScores = SCORE_OPTIONS.filter(s => !takenScores.has(s));
  // Available colors: not taken by other moods
  const availableColors = COLOR_OPTIONS.filter(c => !takenColors.has(c.value));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('moodPathway.editMood') : t('moodPathway.addMood')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('moodPathway.editMoodDesc') : t('moodPathway.addMoodDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emoji picker */}
          <div className="space-y-1.5">
            <Label>{t('moodPathway.emoji')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map(e => {
                const taken = takenEmojis.has(e);
                if (taken) return null;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-lg border-2 transition-all ${
                      emoji === e ? 'border-primary bg-primary/10 scale-110' : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Label className="text-xs text-muted-foreground">{t('moodPathway.customEmoji')}:</Label>
              <Input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-16 text-center text-lg"
                maxLength={4}
              />
            </div>
            {isEmojiConflict && (
              <p className="text-xs text-destructive">{t('moodPathway.emojiTaken')}</p>
            )}
          </div>

          {/* Labels */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('moodPathway.labelEn')}</Label>
              <Input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="e.g. Excited" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('moodPathway.labelAr')}</Label>
              <Input value={labelAr} onChange={e => setLabelAr(e.target.value)} placeholder="مثال: متحمس" dir="rtl" />
            </div>
          </div>

          {/* Key (auto-generated or editable for new) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>{t('moodPathway.moodKey')}</Label>
              <Input
                value={key || generatedKey}
                onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="auto_generated"
                className="font-mono text-xs"
              />
              {keyConflict && (
                <p className="text-xs text-destructive">{t('moodPathway.keyConflict')}</p>
              )}
            </div>
          )}

          {/* Color & Score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('moodPathway.color')}</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue>
                    {(() => {
                      const selected = COLOR_OPTIONS.find(c => c.value === color);
                      return selected ? (
                        <span className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${selected.dot}`} />
                          {selected.label}
                        </span>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => {
                    const taken = takenColors.has(c.value);
                    if (taken) return null;
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                          <span className="font-medium">{c.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('moodPathway.score')}</Label>
              <Select value={String(score)} onValueChange={v => setScore(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map(s => {
                    const taken = takenScores.has(s);
                    if (taken) return null;
                    return (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('moodPathway.scoreDesc')}</p>
              {isScoreConflict && (
                <p className="text-xs text-destructive">{t('moodPathway.scoreTaken')}</p>
              )}
            </div>
          </div>

          {/* Color conflict warning */}
          {isColorConflict && (
            <p className="text-xs text-destructive">{t('moodPathway.colorTaken')}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
