import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MoodDefinition } from '@/hooks/useMoodDefinitions';

const COLOR_OPTIONS = [
  { value: 'text-chart-1', label: 'Green' },
  { value: 'text-chart-2', label: 'Blue' },
  { value: 'text-chart-3', label: 'Purple' },
  { value: 'text-chart-4', label: 'Yellow' },
  { value: 'text-chart-5', label: 'Pink' },
  { value: 'text-destructive', label: 'Red' },
  { value: 'text-primary', label: 'Primary' },
  { value: 'text-muted-foreground', label: 'Gray' },
];

const EMOJI_SUGGESTIONS = ['😄', '🙂', '😐', '😟', '😢', '😊', '🤩', '😔', '😰', '💪', '🧘', '😴', '🤔', '😤', '🥺'];

interface MoodDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mood: MoodDefinition | null;
  onSave: (data: Partial<MoodDefinition>) => void;
  isSaving: boolean;
  existingKeys: string[];
}

export function MoodDefinitionDialog({
  open, onOpenChange, mood, onSave, isSaving, existingKeys,
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

  const generatedKey = key || labelEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const keyConflict = !isEdit && existingKeys.includes(generatedKey);
  const canSave = labelEn.trim() && labelAr.trim() && emoji && !keyConflict;

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
              {EMOJI_SUGGESTIONS.map(e => (
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
              ))}
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className={`${c.value} font-medium`}>● {c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('moodPathway.score')}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={score}
                onChange={e => setScore(parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">{t('moodPathway.scoreDesc')}</p>
            </div>
          </div>
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
