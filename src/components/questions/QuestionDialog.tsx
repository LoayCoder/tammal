import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import { Question, QuestionType, CreateQuestionInput } from "@/hooks/useQuestions";
import { QuestionCategory } from "@/hooks/useQuestionCategories";
import { DEFAULT_MOOD_META } from '@/config/moods';
import { Plus, X } from "lucide-react";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  categories: QuestionCategory[];
  onSubmit: (data: CreateQuestionInput) => void;
  isLoading?: boolean;
}

export function QuestionDialog({
  open,
  onOpenChange,
  question,
  categories,
  onSubmit,
  isLoading,
}: QuestionDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [text, setText] = useState("");
  const [textAr, setTextAr] = useState("");
  const [type, setType] = useState<QuestionType>("likert_5");
  const [categoryId, setCategoryId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [moodLevels, setMoodLevels] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  const MOOD_LEVELS = DEFAULT_MOOD_META.map(m => ({
    value: m.key,
    label: `${m.emoji} ${m.key.charAt(0).toUpperCase() + m.key.slice(1).replace('_', ' ')}`,
    label_ar: `${m.emoji} ${m.labelAr}`,
  }));

  useEffect(() => {
    if (question) {
      setText(question.text);
      setTextAr(question.text_ar || "");
      setType(question.type);
      setCategoryId(question.category_id || "");
      setOptions(question.options || []);
      setMoodLevels(question.mood_levels || []);
      setIsActive(question.is_active);
      setIsGlobal(question.is_global);
    } else {
      setText("");
      setTextAr("");
      setType("likert_5");
      setCategoryId("");
      setOptions([]);
      setMoodLevels([]);
      setIsActive(true);
      setIsGlobal(false);
    }
  }, [question, open]);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      text,
      text_ar: textAr || undefined,
      type,
      category_id: categoryId || undefined,
      options: type === 'multiple_choice' ? options.filter(Boolean) : undefined,
      mood_levels: moodLevels,
      is_active: isActive,
      is_global: isGlobal,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? t('questions.editQuestion') : t('questions.addQuestion')}
          </DialogTitle>
          <DialogDescription>
            {question ? t('questions.editQuestionDescription') : t('questions.addQuestionDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="text">{t('questions.questionText')} (English)</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('questions.questionTextPlaceholder')}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textAr">{t('questions.questionText')} (العربية)</Label>
              <Textarea
                id="textAr"
                value={textAr}
                onChange={(e) => setTextAr(e.target.value)}
                placeholder={t('questions.questionTextPlaceholderAr')}
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('questions.type')}</Label>
                <QuestionTypeSelector value={type} onChange={setType} />
              </div>

              <div className="space-y-2">
                <Label>{t('questions.category')}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('questions.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }} 
                          />
                          {isRTL && cat.name_ar ? cat.name_ar : cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>{t('questions.options')}</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`${t('questions.option')} ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('questions.addOption')}
                  </Button>
                </div>
              </div>
            )}

            {/* Mood Levels */}
            <div className="space-y-2">
              <Label>{t('questions.moodLevels')}</Label>
              <p className="text-xs text-muted-foreground">{t('questions.moodLevelsHint')}</p>
              <div className="flex flex-wrap gap-3">
                {MOOD_LEVELS.map(mood => (
                  <label key={mood.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={moodLevels.includes(mood.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMoodLevels([...moodLevels, mood.value]);
                        } else {
                          setMoodLevels(moodLevels.filter(m => m !== mood.value));
                        }
                      }}
                    />
                    <span className="text-sm">{isRTL ? mood.label_ar : mood.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">{t('questions.isActive')}</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isGlobal"
                  checked={isGlobal}
                  onCheckedChange={setIsGlobal}
                />
                <Label htmlFor="isGlobal">{t('questions.isGlobal')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {question ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
