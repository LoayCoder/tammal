import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Save, RotateCcw, Link2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { MoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import type { MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';

interface TaggedQuestion {
  id: string;
  text?: string;
  text_ar?: string | null;
  [key: string]: any;
}

interface MoodConfigCardProps {
  moodDef: MoodDefinition;
  config: MoodQuestionConfig | undefined;
  taggedQuestions: TaggedQuestion[];
  isRTL: boolean;
  isSaving: boolean;
  onUpdateField: (moodLevel: string, field: keyof MoodQuestionConfig, value: any) => void;
  onSave: (moodLevel: string) => void;
  onOpenPicker: (moodLevel: string) => void;
  onUnlinkQuestion: (questionId: string, moodLevel: string) => void;
}

export function MoodConfigCard({
  moodDef, config, taggedQuestions, isRTL, isSaving,
  onUpdateField, onSave, onOpenPicker, onUnlinkQuestion,
}: MoodConfigCardProps) {
  const { t } = useTranslation();
  const moodLevel = moodDef.key;
  const moodLabel = isRTL ? moodDef.label_ar : moodDef.label_en;
  const isEnabled = config?.is_enabled ?? true;

  return (
    <Card className="glass-card border-0 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{moodDef.emoji}</span>
            <div>
              <CardTitle className={`text-base ${moodDef.color}`}>{moodLabel}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t('moodPathway.linkedQuestionsCount', { count: taggedQuestions.length })}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t('moodPathway.enablePathway')}</Label>
          <Switch checked={isEnabled} onCheckedChange={v => onUpdateField(moodLevel, 'is_enabled', v)} />
        </div>

        {/* Enable free-text */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t('moodPathway.enableFreeText')}</Label>
          <Switch
            checked={config?.enable_free_text ?? false}
            onCheckedChange={v => onUpdateField(moodLevel, 'enable_free_text', v)}
            disabled={!isEnabled}
          />
        </div>

        {/* Questions per mood */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t('moodPathway.questionsPerMood')}</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onUpdateField(moodLevel, 'max_questions', Math.max(1, (config?.max_questions ?? 2) - 1))}
              disabled={!isEnabled || (config?.max_questions ?? 2) <= 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {config?.max_questions ?? 2}
            </span>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onUpdateField(moodLevel, 'max_questions', Math.min(10, (config?.max_questions ?? 2) + 1))}
              disabled={!isEnabled || (config?.max_questions ?? 2) >= 10}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Linked questions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('moodPathway.linkedQuestions')}</Label>
            <Button
              variant="outline" size="sm" className="h-7 text-xs gap-1.5"
              onClick={() => onOpenPicker(moodLevel)} disabled={!isEnabled}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('moodPathway.browseQuestions')}
            </Button>
          </div>
          {taggedQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <Link2 className="h-4 w-4 text-muted-foreground inline-block mb-1" />
              <p className="text-xs text-muted-foreground">{t('moodPathway.noLinkedQuestions')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {taggedQuestions.map(q => {
                const text = isRTL && q.text_ar ? q.text_ar : q.text;
                return (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5">
                    <p className="text-sm flex-1 line-clamp-2" dir="auto">{text}</p>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onUnlinkQuestion(q.id, moodLevel)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Recommendation Hint */}
        {isEnabled && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('moodPathway.aiRecommendationHint')}</Label>
            <Textarea
              value={config?.custom_prompt_context || ''}
              onChange={e => onUpdateField(moodLevel, 'custom_prompt_context', e.target.value || null)}
              placeholder={t('moodPathway.aiRecommendationHintPlaceholder')}
              rows={2} className="resize-none text-sm rounded-xl" dir="auto"
            />
            <p className="text-xs text-muted-foreground">{t('moodPathway.aiRecommendationHintDesc')}</p>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            size="sm" onClick={() => onSave(moodLevel)} disabled={isSaving}
            className="gap-1.5 h-8 px-4 rounded-lg text-xs"
          >
            {isSaving ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {t('moodPathway.saveSettings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
