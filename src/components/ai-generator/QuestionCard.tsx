import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw, Edit2, Copy, ChevronDown, Check, X,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedGeneratedQuestion } from '@/hooks/useEnhancedAIGeneration';
import { toast } from 'sonner';

interface QuestionCardProps {
  question: EnhancedGeneratedQuestion;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<EnhancedGeneratedQuestion>) => void;
  onRegenerate?: (index: number) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  passed: <CheckCircle className="h-4 w-4 text-primary" />,
  warning: <AlertTriangle className="h-4 w-4 text-chart-4" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  pending: <Info className="h-4 w-4 text-muted-foreground" />,
};

export function QuestionCard({ question, index, onRemove, onUpdate, onRegenerate }: QuestionCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.question_text);
  const [editTextAr, setEditTextAr] = useState(question.question_text_ar);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const handleSaveEdit = () => {
    onUpdate(index, { question_text: editText, question_text_ar: editTextAr });
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(question.question_text);
    toast.success(t('aiGenerator.copied'));
  };

  const borderClass = question.validation_status === 'failed'
    ? 'border-destructive'
    : question.validation_status === 'warning'
      ? 'border-chart-4'
      : '';

  return (
    <Card className={borderClass}>
      <CardContent className="pt-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{question.type}</Badge>
            <Badge variant="outline">{question.complexity}</Badge>
            <Badge variant="outline" className="text-xs">{question.tone}</Badge>
            <Tooltip>
              <TooltipTrigger>{statusIcons[question.validation_status]}</TooltipTrigger>
              <TooltipContent>{t(`aiGenerator.status_${question.validation_status}`)}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{question.confidence_score}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('aiGenerator.confidenceScore')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Confidence bar */}
        <Progress
          value={question.confidence_score}
          className="h-1.5"
        />

        {/* Question text */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <Textarea
              value={editTextAr}
              onChange={e => setEditTextAr(e.target.value)}
              className="text-sm"
              dir="rtl"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-3 w-3 me-1" />
                {t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-3 w-3 me-1" />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-medium text-sm">{question.question_text}</p>
            {question.question_text_ar && (
              <p className="text-muted-foreground text-sm" dir="rtl">{question.question_text_ar}</p>
            )}
          </>
        )}

        {/* Flags */}
        {(question.bias_flag || question.ambiguity_flag) && (
          <div className="flex gap-2">
            {question.bias_flag && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 me-1" />
                {t('aiGenerator.biasDetected')}
              </Badge>
            )}
            {question.ambiguity_flag && (
              <Badge variant="outline" className="text-xs border-chart-4 text-chart-4">
                <AlertTriangle className="h-3 w-3 me-1" />
                {t('aiGenerator.ambiguityDetected')}
              </Badge>
            )}
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <Collapsible open={explanationOpen} onOpenChange={setExplanationOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                {t('aiGenerator.explanation')}
                <ChevronDown className={`h-3 w-3 transition-transform ${explanationOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">{question.explanation}</p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-1 border-t">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditText(question.question_text); setEditTextAr(question.question_text_ar); setIsEditing(true); }}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          {onRegenerate && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRegenerate(index)}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(index)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
