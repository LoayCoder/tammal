import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TopControlBar } from '@/components/ai-generator/TopControlBar';
import { ConfigPanel, type QuestionPurpose } from '@/components/ai-generator/ConfigPanel';
import { QuestionCard } from '@/components/ai-generator/QuestionCard';
import { ValidationReport } from '@/components/ai-generator/ValidationReport';
import { BatchSaveDialog } from '@/components/ai-generator/BatchSaveDialog';
import { WellnessSavePreviewDialog } from '@/components/ai-generator/WellnessSavePreviewDialog';
import { useEnhancedAIGeneration, AdvancedSettings } from '@/hooks/useEnhancedAIGeneration';
import { useMoodDefinitions } from '@/hooks/useMoodDefinitions';
import { useAIModels } from '@/hooks/useAIModels';
import { useAIKnowledge } from '@/hooks/useAIKnowledge';
import { useReferenceFrameworks } from '@/hooks/useReferenceFrameworks';
import { useQuestionBatches } from '@/hooks/useQuestionBatches';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AIQuestionGenerator() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { models } = useAIModels();
  const {
    documents, uploadDocument, toggleDocument, deleteDocument, deleteAllDocuments, isUploading,
  } = useAIKnowledge();
  const {
    frameworks: referenceFrameworks, isLoading: frameworksLoading,
    addFramework, updateFramework, deleteFramework,
  } = useReferenceFrameworks();
  const {
    questions, validationReport, generationMeta,
    generate, validate, saveSet, saveWellness, removeQuestion, updateQuestion, clearAll,
    isGenerating, isValidating, isSaving, isSavingWellness,
  } = useEnhancedAIGeneration();

  // Get tenant ID for batch fetching
  const { data: tenantId } = useQuery({
    queryKey: ['user-tenant-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc('get_user_tenant_id', { _user_id: user.id });
      return data as string | null;
    },
    enabled: !!user?.id,
  });

  const { availableBatches, MAX_BATCH_SIZE } = useQuestionBatches(tenantId || null);
  const { moods: moodDefinitions } = useMoodDefinitions(tenantId || null);

  const [accuracyMode, setAccuracyMode] = useState('standard');
  const [selectedModel, setSelectedModel] = useState('google/gemini-3-flash-preview');
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
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
  const [customPrompt, setCustomPrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedMoodLevels, setSelectedMoodLevels] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [wellnessPreviewOpen, setWellnessPreviewOpen] = useState(false);
  const [purpose, setPurpose] = useState<QuestionPurpose>('survey');

  const isStrict = accuracyMode === 'strict';
  const hasFailures = validationReport?.overall_result === 'failed';
  const canSave = questions.length > 0 && !(isStrict && hasFailures);
  const canExport = canSave;

  const handleGenerate = async () => {
    if (selectedCategoryIds.length === 0) {
      toast.error(t('aiGenerator.selectAtLeastOneCategory'));
      return;
    }
    if (!selectedModel) {
      toast.error(t('aiGenerator.selectModel'));
      return;
    }
    const activeDocIds = documents.filter(d => d.is_active).map(d => d.id);
    const resolvedType = questionTypes.length === 0 ? 'mixed' : questionTypes.join(', ');
    generate({
      questionCount, complexity, tone, questionType: resolvedType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      knowledgeDocumentIds: activeDocIds,
      customPrompt: customPrompt.trim() || undefined,
      selectedFrameworks: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      categoryIds: selectedCategoryIds,
      subcategoryIds: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds : undefined,
      moodLevels: purpose === 'wellness' ? selectedMoodLevels : undefined,
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
          model: selectedModel,
          useExpertKnowledge: selectedFrameworkIds.length > 0,
          selectedFrameworkIds: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
          documentSummaries: documentSummaries || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error(t('aiGenerator.rateLimitError'));
        } else if (data.error.includes('Payment required') || data.error.includes('credits')) {
          toast.error(t('aiGenerator.creditsError'));
        } else {
          throw new Error(data.error);
        }
        return;
      }
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
    const activeDocIds = documents.filter(d => d.is_active).map(d => d.id);
    validate({
      questions, accuracyMode,
      model: selectedModel,
      enableCriticPass: advancedSettings.enableCriticPass,
      minWordLength: advancedSettings.minWordLength,
      selectedFrameworkIds: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      hasDocuments: documents.length > 0,
    });
  };

  const handleSaveClick = () => {
    if (purpose === 'wellness') {
      setWellnessPreviewOpen(true);
    } else {
      setBatchDialogOpen(true);
    }
  };

  const handleWellnessConfirm = () => {
    saveWellness({ questions }, {
      onSuccess: () => {
        setWellnessPreviewOpen(false);
        clearAll();
        if (documents.length > 0) deleteAllDocuments();
      },
    });
  };

  const handleBatchConfirm = (targetBatchId?: string) => {
    saveSet({
      questions, model: selectedModel, accuracyMode,
      settings: {
        questionCount, complexity, tone, questionTypes, advancedSettings,
        selected_framework_ids: selectedFrameworkIds,
        custom_prompt: customPrompt,
        categoryIds: selectedCategoryIds,
        subcategoryIds: selectedSubcategoryIds,
      },
      validationReport,
      targetBatchId,
    }, {
      onSuccess: () => {
        setBatchDialogOpen(false);
        clearAll();
        if (documents.length > 0) deleteAllDocuments();
      },
    });
  };

  const handleExport = (format: 'json' | 'pdf') => {
    const exportData = {
      metadata: {
        model: selectedModel, accuracyMode, generatedAt: new Date().toISOString(),
        settings: { questionCount, complexity, tone, questionTypes, selectedFrameworkIds, selectedCategoryIds, selectedSubcategoryIds },
        validation: validationReport ? { overall: validationReport.overall_result, avgConfidence: validationReport.avg_confidence } : null,
      },
      questions: questions.map(q => ({
        question_text: q.question_text, question_text_ar: q.question_text_ar,
        type: q.type, complexity: q.complexity, tone: q.tone,
        confidence_score: q.confidence_score, explanation: q.explanation,
        framework_reference: q.framework_reference,
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
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = `<html><head><title>Question Set</title><style>body{font-family:sans-serif;padding:2rem;} .q{margin:1rem 0;padding:1rem;border:1px solid #ddd;border-radius:8px;} .badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#f0f0f0;font-size:12px;margin-inline-end:4px;} .ar{direction:rtl;color:#666;margin-top:4px;}</style></head><body>
          <h1>${t('aiGenerator.title')}</h1>
          <p>Model: ${selectedModel} | Accuracy: ${accuracyMode} | ${new Date().toLocaleDateString()}</p>
          ${questions.map((q, i) => `<div class="q"><span class="badge">${q.type}</span><span class="badge">${q.complexity}</span><span class="badge">${q.confidence_score}%</span>${q.framework_reference ? `<span class="badge">${q.framework_reference}</span>` : ''}<p><strong>${i + 1}. ${q.question_text}</strong></p><p class="ar">${q.question_text_ar}</p>${q.explanation ? `<p style="font-size:12px;color:#888;">${q.explanation}</p>` : ''}</div>`).join('')}
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
    const activeDocIds = documents.filter(d => d.is_active).map(d => d.id);
    const resolvedType = questionTypes.length === 0 ? 'mixed' : questionTypes.join(', ');
    generate({
      questionCount: failedCount, complexity, tone, questionType: resolvedType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      selectedFrameworks: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      categoryIds: selectedCategoryIds,
      subcategoryIds: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds : undefined,
      moodLevels: purpose === 'wellness' ? selectedMoodLevels : undefined,
    });
  };

  const handleRegenerateSingle = (index: number) => {
    const activeDocIds = documents.filter(d => d.is_active).map(d => d.id);
    const q = questions[index];
    const singleType = q.type || (questionTypes.length === 0 ? 'mixed' : questionTypes.join(', '));
    generate({
      questionCount: 1, complexity: q.complexity || complexity, tone: q.tone || tone, questionType: singleType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      selectedFrameworks: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      categoryIds: selectedCategoryIds,
      subcategoryIds: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds : undefined,
      moodLevels: purpose === 'wellness' ? (q.mood_levels?.length ? q.mood_levels : selectedMoodLevels) : undefined,
      _replaceAtIndex: index,
    } as any);
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
        onSave={handleSaveClick}
        onExport={handleExport}
        canSave={canSave}
        canExport={canExport}
        isSaving={isSaving || isSavingWellness}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ConfigPanel
            purpose={purpose}
            onPurposeChange={setPurpose}
            questionTypes={questionTypes}
            onQuestionTypesChange={setQuestionTypes}
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
            documents={documents}
            onUploadDocument={uploadDocument}
            onToggleDocument={toggleDocument}
            onDeleteDocument={deleteDocument}
            isUploading={isUploading}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            onRewritePrompt={handleRewritePrompt}
            isRewriting={isRewriting}
            referenceFrameworks={referenceFrameworks}
            selectedFrameworkIds={selectedFrameworkIds}
            onSelectedFrameworkIdsChange={setSelectedFrameworkIds}
            onAddFramework={addFramework}
            onUpdateFramework={updateFramework}
            onDeleteFramework={deleteFramework}
            frameworksLoading={frameworksLoading}
            currentUserId={user?.id}
            selectedCategoryIds={selectedCategoryIds}
            onSelectedCategoryIdsChange={setSelectedCategoryIds}
            selectedSubcategoryIds={selectedSubcategoryIds}
            onSelectedSubcategoryIdsChange={setSelectedSubcategoryIds}
            selectedMoodLevels={selectedMoodLevels}
            onSelectedMoodLevelsChange={setSelectedMoodLevels}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isStrict && hasFailures && questions.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t('aiGenerator.strictModeMessage')}</AlertDescription>
            </Alert>
          )}

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
                  <Button variant="ghost" size="sm" onClick={() => { clearAll(); if (documents.length > 0) deleteAllDocuments(); }}>
                    {t('aiGenerator.clearAll')}
                  </Button>
                </div>
              </div>

              {validationReport && (
                <ValidationReport report={validationReport} isStrictMode={isStrict} />
              )}

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} onRemove={removeQuestion} onUpdate={updateQuestion} onRegenerate={handleRegenerateSingle} selectedModel={selectedModel} purpose={purpose} moodDefinitions={moodDefinitions} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <BatchSaveDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        availableBatches={availableBatches}
        questionCount={questions.length}
        maxBatchSize={MAX_BATCH_SIZE}
        onConfirm={handleBatchConfirm}
        isSaving={isSaving}
      />

      <WellnessSavePreviewDialog
        open={wellnessPreviewOpen}
        onOpenChange={setWellnessPreviewOpen}
        questions={questions}
        onConfirm={handleWellnessConfirm}
        isSaving={isSavingWellness}
      />
    </div>
  );
}
