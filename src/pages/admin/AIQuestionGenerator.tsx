import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Plus, Trash2, Check } from 'lucide-react';
import { useAIQuestionGeneration, GeneratedQuestion } from '@/hooks/useAIQuestionGeneration';
import { useQuestionCategories } from '@/hooks/useQuestionCategories';
import { useQuestions } from '@/hooks/useQuestions';
import { toast } from 'sonner';

const focusAreaOptions = [
  { value: 'burnout', label: 'Burnout Prevention' },
  { value: 'engagement', label: 'Employee Engagement' },
  { value: 'worklife', label: 'Work-Life Balance' },
  { value: 'growth', label: 'Career Growth' },
  { value: 'culture', label: 'Company Culture' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication' },
  { value: 'wellbeing', label: 'Mental Wellbeing' },
];

export default function AIQuestionGenerator() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  const { generateQuestions, generatedQuestions, isGenerating, clearGenerated, removeQuestion } = useAIQuestionGeneration();
  const { categories } = useQuestionCategories();
  const { createQuestion } = useQuestions();
  
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(3);
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'advanced'>('moderate');
  const [tone, setTone] = useState<'formal' | 'casual' | 'neutral'>('neutral');
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const handleGenerate = () => {
    if (focusAreas.length === 0) {
      toast.error(t('aiGenerator.selectFocusAreas'));
      return;
    }
    generateQuestions.mutate({
      focusAreas,
      questionCount,
      complexity,
      tone,
      language: 'both',
    });
  };

  const handleSaveQuestion = async (question: GeneratedQuestion, index: number) => {
    setSavingIndex(index);
    try {
      const category = categories.find(c => 
        c.name.toLowerCase().includes(question.category.toLowerCase()) ||
        question.category.toLowerCase().includes(c.name.toLowerCase())
      );
      
      await createQuestion.mutateAsync({
        text: question.text,
        text_ar: question.text_ar,
        type: question.type,
        category_id: category?.id,
        options: question.options || [],
        is_active: true,
        ai_generated: true,
      });
      
      removeQuestion(index);
    } finally {
      setSavingIndex(null);
    }
  };

  const handleSaveAll = async () => {
    for (let i = generatedQuestions.length - 1; i >= 0; i--) {
      await handleSaveQuestion(generatedQuestions[i], i);
    }
  };

  const toggleFocusArea = (value: string) => {
    setFocusAreas(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('aiGenerator.title')}</h1>
        <p className="text-muted-foreground">{t('aiGenerator.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('aiGenerator.generateQuestions')}
            </CardTitle>
            <CardDescription>{t('aiGenerator.formDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('aiGenerator.focusAreas')}</Label>
              <div className="flex flex-wrap gap-2">
                {focusAreaOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={focusAreas.includes(option.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFocusArea(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('aiGenerator.questionCount')}</Label>
                <Select value={String(questionCount)} onValueChange={v => setQuestionCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('aiGenerator.complexity')}</Label>
                <Select value={complexity} onValueChange={(v: 'simple' | 'moderate' | 'advanced') => setComplexity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">{t('aiGenerator.simple')}</SelectItem>
                    <SelectItem value="moderate">{t('aiGenerator.moderate')}</SelectItem>
                    <SelectItem value="advanced">{t('aiGenerator.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('aiGenerator.tone')}</Label>
              <Select value={tone} onValueChange={(v: 'formal' | 'casual' | 'neutral') => setTone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">{t('aiGenerator.formal')}</SelectItem>
                  <SelectItem value="casual">{t('aiGenerator.casual')}</SelectItem>
                  <SelectItem value="neutral">{t('aiGenerator.neutral')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t('aiGenerator.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 me-2" />
                  {t('aiGenerator.generate')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('aiGenerator.generatedQuestions')}</span>
              {generatedQuestions.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearGenerated}>
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleSaveAll}>
                    <Check className="h-4 w-4 me-1" />
                    {t('aiGenerator.saveAll')}
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {generatedQuestions.length > 0 
                ? t('aiGenerator.questionsGenerated', { count: generatedQuestions.length })
                : t('aiGenerator.noQuestionsYet')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('aiGenerator.emptyState')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedQuestions.map((question, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{question.type}</Badge>
                            <Badge variant="outline">{question.category}</Badge>
                          </div>
                          <p className="font-medium">{question.text}</p>
                          {question.text_ar && (
                            <p className="text-muted-foreground text-sm" dir="rtl">{question.text_ar}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => handleSaveQuestion(question, index)}
                            disabled={savingIndex === index}
                          >
                            {savingIndex === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}