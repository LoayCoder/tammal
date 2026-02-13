import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { TopControlBar } from '@/components/ai-generator/TopControlBar';
import { ConfigPanel } from '@/components/ai-generator/ConfigPanel';
import { QuestionCard } from '@/components/ai-generator/QuestionCard';
import { ValidationReport } from '@/components/ai-generator/ValidationReport';
import { useEnhancedAIGeneration, AdvancedSettings } from '@/hooks/useEnhancedAIGeneration';
import { useAIModels } from '@/hooks/useAIModels';
import { useAIKnowledge } from '@/hooks/useAIKnowledge';
import { useFocusAreas } from '@/hooks/useFocusAreas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AIQuestionGenerator() {
  const { t } = useTranslation();
  const { models } = useAIModels();
  const {
    documents, uploadDocument, toggleDocument, deleteDocument, isUploading,
  } = useAIKnowledge();
  const {
    focusAreas: focusAreaList, isLoading: focusAreasLoading,
    addFocusArea, updateFocusArea, deleteFocusArea,
  } = useFocusAreas();
  const {
    questions, validationReport, generationMeta,
    generate, validate, saveSet, removeQuestion, updateQuestion, clearAll,
    isGenerating, isValidating, isSaving,
  } = useEnhancedAIGeneration();

  const [accuracyMode, setAccuracyMode] = useState('standard');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [complexity, setComplexity] = useState('moderate');
  const [tone, setTone] = useState('neutral');
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    requireExplanation: true,
    enableBiasDetection: true,
    enableAmbiguityDetection: true,
    enableDuplicateDetection: true,
    enableCriticPass: false,
    minWordLength: 5,
  });
  const [useExpertKnowledge, setUseExpertKnowledge] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const isStrict = accuracyMode === 'strict';
  const hasFailures = validationReport?.overall_result === 'failed';
  const canSave = questions.length > 0 && !(isStrict && hasFailures);
  const canExport = canSave;

  const handleGenerate = () => {
    if (focusAreas.length === 0) {
      toast.error(t('aiGenerator.selectFocusAreas'));
      return;
    }
    if (!selectedModel) {
      toast.error(t('aiGenerator.selectModel'));
      return;
    }
    const activeDocIds = documents.filter(d => d.is_active).map(d => d.id);
    generate({
      focusAreas, questionCount, complexity, tone, questionType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge,
      knowledgeDocumentIds: activeDocIds,
      customPrompt: customPrompt.trim() || undefined,
      selectedFrameworks: selectedFrameworks.length > 0 ? selectedFrameworks : undefined,
    });
  };

  const handleRewritePrompt = async () => {
    if (customPrompt.trim().length < 10) return;
    setIsRewriting(true);
    try {
      const activeDocs = documents.filter(d => d.is_active && d.content_text);
      const documentSummaries = activeDocs
        .map(d => `[${d.file_name}]: ${(d.content_text || '').substring(0, 400)}`)
        .join('\n')
        .substring(0, 2000);
      const { data, error } = await supabase.functions.invoke('rewrite-prompt', {
        body: {
          prompt: customPrompt,
          useExpertKnowledge,
          selectedFrameworks: selectedFrameworks.length > 0 ? selectedFrameworks : undefined,
          documentSummaries: documentSummaries || undefined,
        },
      });
      if (error) throw error;
      if (data?.rewrittenPrompt) {
        setCustomPrompt(data.rewrittenPrompt);
        toast.success(t('aiGenerator.rewriteSuccess'));
      }
    } catch (err: any) {
      toast.error(err.message || t('aiGenerator.rewriteError'));
    } finally {
      setIsRewriting(false);
    }
  };

  const handleValidate = () => {
    validate({
      questions, accuracyMode,
      enableCriticPass: advancedSettings.enableCriticPass,
      minWordLength: advancedSettings.minWordLength,
    });
  };

  const handleSave = () => {
    saveSet({
      questions, model: selectedModel, accuracyMode,
      settings: { focusAreas, questionCount, complexity, tone, questionType, advancedSettings },
      validationReport,
    });
  };

  const handleExport = (format: 'json' | 'pdf' | 'docx') => {
    const exportData = {
      metadata: {
        model: selectedModel, accuracyMode, generatedAt: new Date().toISOString(),
        settings: { focusAreas, questionCount, complexity, tone, questionType },
        validation: validationReport ? { overall: validationReport.overall_result, avgConfidence: validationReport.avg_confidence } : null,
      },
      questions: questions.map(q => ({
        question_text: q.question_text, question_text_ar: q.question_text_ar,
        type: q.type, complexity: q.complexity, tone: q.tone,
        confidence_score: q.confidence_score, explanation: q.explanation,
      })),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-set-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('aiGenerator.exportSuccess'));
    } else {
      // For PDF/DOCX, use printable HTML
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = `<html><head><title>Question Set</title><style>body{font-family:sans-serif;padding:2rem;} .q{margin:1rem 0;padding:1rem;border:1px solid #ddd;border-radius:8px;} .badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#f0f0f0;font-size:12px;margin-inline-end:4px;} .ar{direction:rtl;color:#666;margin-top:4px;}</style></head><body>
          <h1>${t('aiGenerator.title')}</h1>
          <p>Model: ${selectedModel} | Accuracy: ${accuracyMode} | ${new Date().toLocaleDateString()}</p>
          ${questions.map((q, i) => `<div class="q"><span class="badge">${q.type}</span><span class="badge">${q.complexity}</span><span class="badge">${q.confidence_score}%</span><p><strong>${i + 1}. ${q.question_text}</strong></p><p class="ar">${q.question_text_ar}</p>${q.explanation ? `<p style="font-size:12px;color:#888;">${q.explanation}</p>` : ''}</div>`).join('')}
        </body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleRegenerateFailedOnly = () => {
    const failedCount = questions.filter(q => q.validation_status === 'failed').length;
    if (failedCount === 0) return;
    // Generate replacement questions for failed ones
    generate({
      focusAreas, questionCount: failedCount, complexity, tone, questionType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('aiGenerator.title')}</h1>
        <p className="text-muted-foreground">{t('aiGenerator.subtitle')}</p>
      </div>

      <TopControlBar
        accuracyMode={accuracyMode}
        onAccuracyModeChange={setAccuracyMode}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        models={models}
        onSave={handleSave}
        onExport={handleExport}
        canSave={canSave}
        canExport={canExport}
        isSaving={isSaving}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Config (2 cols) */}
        <div className="lg:col-span-2">
          <ConfigPanel
            focusAreas={focusAreas}
            onFocusAreasChange={setFocusAreas}
            questionType={questionType}
            onQuestionTypeChange={setQuestionType}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            complexity={complexity}
            onComplexityChange={setComplexity}
            tone={tone}
            onToneChange={setTone}
            advancedSettings={advancedSettings}
            onAdvancedSettingsChange={setAdvancedSettings}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            useExpertKnowledge={useExpertKnowledge}
            onUseExpertKnowledgeChange={setUseExpertKnowledge}
            documents={documents}
            onUploadDocument={uploadDocument}
            onToggleDocument={toggleDocument}
            onDeleteDocument={deleteDocument}
            isUploading={isUploading}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            onRewritePrompt={handleRewritePrompt}
            isRewriting={isRewriting}
            selectedFrameworks={selectedFrameworks}
            onSelectedFrameworksChange={setSelectedFrameworks}
            focusAreaList={focusAreaList}
            focusAreasLoading={focusAreasLoading}
            onAddFocusArea={addFocusArea}
            onUpdateFocusArea={updateFocusArea}
            onDeleteFocusArea={deleteFocusArea}
          />
        </div>

        {/* Right: Results (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {isGenerating ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold text-muted-foreground">{t('aiGenerator.emptyTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('aiGenerator.emptyDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Action bar */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('aiGenerator.questionsGenerated', { count: questions.length })}
                  {generationMeta && ` • ${generationMeta.duration_ms}ms`}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleValidate} disabled={isValidating}>
                    {isValidating ? <RefreshCw className="h-4 w-4 animate-spin me-1" /> : <ShieldCheck className="h-4 w-4 me-1" />}
                    {t('aiGenerator.runValidation')}
                  </Button>
                  {isStrict && hasFailures && (
                    <Button variant="outline" size="sm" onClick={handleRegenerateFailedOnly}>
                      <RefreshCw className="h-4 w-4 me-1" />
                      {t('aiGenerator.regenerateFailed')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    {t('aiGenerator.clearAll')}
                  </Button>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i}
                    onRemove={removeQuestion}
                    onUpdate={updateQuestion}
                  />
                ))}
              </div>

              {/* Validation Report */}
              {validationReport && (
                <ValidationReport report={validationReport} isStrictMode={isStrict} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
