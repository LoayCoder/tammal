import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ClipboardList, Heart } from 'lucide-react';
import type { AIGeneratorState } from '@/features/ai-generator/types';
import type { QuestionPurpose } from './useConfigPanelState';

const MOOD_LEVELS_META = [
  { value: 'great', label: '😄 Great', label_ar: '😄 ممتاز' },
  { value: 'good', label: '🙂 Good', label_ar: '🙂 جيد' },
  { value: 'okay', label: '😐 Okay', label_ar: '😐 عادي' },
  { value: 'struggling', label: '😟 Struggling', label_ar: '😟 أعاني' },
  { value: 'need_help', label: '😢 Need Help', label_ar: '😢 بحاجة للمساعدة' },
];

interface PurposeSelectorProps {
  purpose: QuestionPurpose;
  onPurposeChange: (v: QuestionPurpose) => void;
  selectedMoodLevels: string[];
  onMoodLevelsChange: (v: string[]) => void;
  isRTL: boolean;
}

export function PurposeSelector({
  purpose,
  onPurposeChange,
  selectedMoodLevels,
  onMoodLevelsChange,
  isRTL,
}: PurposeSelectorProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Purpose Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('aiGenerator.purpose')}</Label>
        <p className="text-xs text-muted-foreground">{t('aiGenerator.purposeDescription')}</p>
        <ToggleGroup
          type="single"
          value={purpose}
          onValueChange={(v) => { if (v) onPurposeChange(v as QuestionPurpose); }}
          className="grid grid-cols-2 gap-2"
          variant="outline"
        >
          <ToggleGroupItem
            value="survey"
            className="flex flex-col items-center gap-1 py-3 px-2 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium">{t('aiGenerator.purposeSurvey')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="wellness"
            className="flex flex-col items-center gap-1 py-3 px-2 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs font-medium">{t('aiGenerator.purposeWellness')}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Mood Level Tags — only shown when purpose is wellness */}
      {purpose === 'wellness' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('aiGenerator.moodLevelTags')}</Label>
          <p className="text-xs text-muted-foreground">{t('aiGenerator.moodLevelTagsDesc')}</p>
          <div className="flex flex-wrap gap-3">
            {MOOD_LEVELS_META.map(mood => (
              <label key={mood.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedMoodLevels.includes(mood.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onMoodLevelsChange([...selectedMoodLevels, mood.value]);
                    } else {
                      onMoodLevelsChange(selectedMoodLevels.filter(l => l !== mood.value));
                    }
                  }}
                />
                <span className="text-sm">{isRTL ? mood.label_ar : mood.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}