import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw, Edit2, Copy, ChevronDown, Check, X,
  AlertTriangle, CheckCircle, XCircle, Info, Sparkles, Loader2, Plus
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedGeneratedQuestion } from '@/hooks/useEnhancedAIGeneration';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { QuestionPurpose } from '@/components/ai-generator/ConfigPanel';

const MOOD_LEVELS_META: { key: string; emoji: string; labelKey: string }[] = [
  { key: 'great', emoji: '😄', labelKey: 'checkin.moodGreat' },
  { key: 'good', emoji: '🙂', labelKey: 'checkin.moodGood' },
  { key: 'okay', emoji: '😐', labelKey: 'checkin.moodOkay' },
  { key: 'struggling', emoji: '😟', labelKey: 'checkin.moodStruggling' },
  { key: 'need_help', emoji: '😞', labelKey: 'checkin.moodNeedHelp' },
];

interface QuestionCardProps {
  question: EnhancedGeneratedQuestion;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<EnhancedGeneratedQuestion>) => void;
  onRegenerate?: (index: number) => void;
  selectedModel?: string;
  purpose?: QuestionPurpose;
}

const typeLabels: Record<string, string> = {
  likert_5: 'aiGenerator.typeLikert',
  numeric_scale: 'aiGenerator.typeNumeric',
  yes_no: 'aiGenerator.typeYesNo',
  open_ended: 'aiGenerator.typeOpen',
  multiple_choice: 'aiGenerator.typeMCQ',
};

const statusIcons: Record<string, React.ReactNode> = {
  passed: <CheckCircle className="h-4 w-4 text-primary" />,
  warning: <AlertTriangle className="h-4 w-4 text-chart-4" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  pending: <Info className="h-4 w-4 text-muted-foreground" />,
};

const issueLabels: Record<string, string> = {
  incomplete_structure: 'aiGenerator.issue_incomplete_structure',
  bias_detected: 'aiGenerator.issue_bias_detected',
  ambiguity_detected: 'aiGenerator.issue_ambiguity_detected',
  low_confidence: 'aiGenerator.issue_low_confidence',
  moderate_confidence: 'aiGenerator.issue_moderate_confidence',
  missing_framework_reference: 'aiGenerator.issue_missing_framework',
  missing_arabic: 'aiGenerator.issue_missing_arabic',
  missing_options: 'aiGenerator.issue_missing_options',
  too_short: 'aiGenerator.issue_too_short',
  duplicate: 'aiGenerator.issue_duplicate',
};

export function QuestionCard({ question, index, onRemove, onUpdate, onRegenerate, selectedModel, purpose }: QuestionCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.question_text);
  const [editTextAr, setEditTextAr] = useState(question.question_text_ar);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const handleSaveEdit = () => {
    onUpdate(index, { question_text: editText, question_text_ar: editTextAr });
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(question.question_text);
    toast.success(t('aiGenerator.copied'));
  };

  const handleRewrite = async () => {
    if (!rewritePrompt.trim()) return;
    setIsRewriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rewrite-question', {
        body: {
          question_text: question.question_text,
          question_text_ar: question.question_text_ar,
          type: question.type,
          prompt: rewritePrompt.trim(),
          model: selectedModel,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      onUpdate(index, {
        question_text: data.question_text,
        question_text_ar: data.question_text_ar,
      });
      setRewritePrompt('');
      setRewriteOpen(false);
      toast.success(t('aiGenerator.rewriteSuccess'));
    } catch (err: any) {
      console.error('Rewrite error:', err);
      toast.error(t('aiGenerator.rewriteError'));
    } finally {
      setIsRewriting(false);
    }
  };

  const borderClass = question.validation_status === 'failed'
    ? 'border-destructive'
    : question.validation_status === 'warning'
      ? 'border-chart-4'
      : '';

  const validationIssues: string[] = (question.validation_details as any)?.issues || [];

  return (
    <Card className={borderClass} id={`question-card-${index}`}>
      <CardContent className="pt-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{t(typeLabels[question.type] || 'aiGenerator.typeLikert')}</Badge>
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
        <Progress value={question.confidence_score} className="h-1.5" />

        {/* Question text */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="text-sm" rows={2} />
            <Textarea value={editTextAr} onChange={e => setEditTextAr(e.target.value)} className="text-sm" dir="rtl" rows={2} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-3 w-3 me-1" />{t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-3 w-3 me-1" />{t('common.cancel')}
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

        {/* Per-question Mood Level Tags (wellness only) */}
        {purpose === 'wellness' && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('aiGenerator.moodTags')}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {(question.mood_levels || []).map(mood => {
                const meta = MOOD_LEVELS_META.find(m => m.key === mood);
                if (!meta) return null;
                return (
                  <Badge key={mood} variant="secondary" className="text-xs gap-1 pe-1">
                    <span>{meta.emoji}</span>
                    <span>{t(meta.labelKey, meta.key)}</span>
                    <button
                      type="button"
                      className="ms-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      onClick={() => {
                        const newLevels = (question.mood_levels || []).filter(m => m !== mood);
                        onUpdate(index, { mood_levels: newLevels });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs px-2 gap-1">
                    <Plus className="h-3 w-3" />
                    {t('aiGenerator.addMood')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    {MOOD_LEVELS_META.filter(m => !(question.mood_levels || []).includes(m.key)).map(m => (
                      <Button
                        key={m.key}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs gap-2"
                        onClick={() => {
                          const newLevels = [...(question.mood_levels || []), m.key];
                          onUpdate(index, { mood_levels: newLevels });
                        }}
                      >
                        <span>{m.emoji}</span>
                        <span>{t(m.labelKey, m.key)}</span>
                      </Button>
                    ))}
                    {MOOD_LEVELS_META.filter(m => !(question.mood_levels || []).includes(m.key)).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">{t('common.all')}</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {(question.mood_levels || []).length === 0 && (
              <p className="text-xs text-muted-foreground/70 italic">{t('aiGenerator.noMoodTags')}</p>
            )}
          </div>
        )}

        {/* Expert Knowledge Badges */}
        {(question.framework_reference || question.psychological_construct || question.scoring_mechanism) && (
          <div className="flex flex-wrap gap-1.5">
            {question.framework_reference && (
              <Badge variant="default" className="text-xs">
                {t('aiGenerator.frameworkReference')}: {question.framework_reference}
              </Badge>
            )}
            {question.psychological_construct && (
              <Badge variant="secondary" className="text-xs">
                {t('aiGenerator.psychologicalConstruct')}: {question.psychological_construct}
              </Badge>
            )}
            {question.scoring_mechanism && (
              <Badge variant="outline" className="text-xs">
                {t('aiGenerator.scoringMechanism')}: {question.scoring_mechanism}
              </Badge>
            )}
          </div>
        )}

        {/* Flags */}
        {(question.bias_flag || question.ambiguity_flag) && (
          <div className="flex gap-2">
            {question.bias_flag && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 me-1" />{t('aiGenerator.biasDetected')}
              </Badge>
            )}
            {question.ambiguity_flag && (
              <Badge variant="outline" className="text-xs border-chart-4 text-chart-4">
                <AlertTriangle className="h-3 w-3 me-1" />{t('aiGenerator.ambiguityDetected')}
              </Badge>
            )}
          </div>
        )}

        {/* Per-Question Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {validationIssues.map((issue, idx) => (
              <Badge key={idx} variant={question.validation_status === 'failed' ? 'destructive' : 'outline'} className="text-xs">
                {t(issueLabels[issue] || issue)}
              </Badge>
            ))}
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

        {/* AI Rewrite Prompt Area */}
        {rewriteOpen && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
            <Textarea
              value={rewritePrompt}
              onChange={e => setRewritePrompt(e.target.value)}
              placeholder={t('aiGenerator.rewritePrompt')}
              className="text-sm min-h-[60px]"
              rows={2}
              disabled={isRewriting}
            />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setRewriteOpen(false); setRewritePrompt(''); }} disabled={isRewriting}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleRewrite} disabled={!rewritePrompt.trim() || isRewriting}>
                {isRewriting ? (
                  <><Loader2 className="h-3 w-3 me-1 animate-spin" />{t('aiGenerator.rewriting')}</>
                ) : (
                  <><Sparkles className="h-3 w-3 me-1" />{t('aiGenerator.aiRewrite')}</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-1 border-t">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditText(question.question_text); setEditTextAr(question.question_text_ar); setIsEditing(true); }}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRewriteOpen(!rewriteOpen)}>
                {isRewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('aiGenerator.aiRewrite')}</TooltipContent>
          </Tooltip>
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
