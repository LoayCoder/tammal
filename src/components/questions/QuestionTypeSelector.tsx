import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListOrdered, ToggleLeft, MessageSquare, CheckSquare, Scale } from "lucide-react";
import { QuestionType } from "@/hooks/useQuestions";

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (value: QuestionType) => void;
  disabled?: boolean;
}

const questionTypes: { value: QuestionType; icon: React.ElementType; labelKey: string }[] = [
  { value: 'likert_5', icon: ListOrdered, labelKey: 'questions.types.likert_5' },
  { value: 'numeric_scale', icon: Scale, labelKey: 'questions.types.numeric_scale' },
  { value: 'yes_no', icon: ToggleLeft, labelKey: 'questions.types.yes_no' },
  { value: 'open_ended', icon: MessageSquare, labelKey: 'questions.types.open_ended' },
  { value: 'multiple_choice', icon: CheckSquare, labelKey: 'questions.types.multiple_choice' },
];

export function QuestionTypeSelector({ value, onChange, disabled }: QuestionTypeSelectorProps) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={t('questions.selectType')} />
      </SelectTrigger>
      <SelectContent>
        {questionTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              <type.icon className="h-4 w-4" />
              <span>{t(type.labelKey)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
