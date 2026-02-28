/**
 * useAIGenerator — single orchestrator hook for the AI Question Generator feature.
 * Owns all state, delegates to existing service hooks. Zero Supabase calls.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DEFAULT_AI_MODEL, DEFAULT_ACCURACY_MODE, DEFAULT_AI_SETTINGS } from '@/config/ai';
import { useEnhancedAIGeneration, type AdvancedSettings } from '@/hooks/questions/useEnhancedAIGeneration';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { useAIModels } from '@/hooks/questions/useAIModels';
import { useAIKnowledge } from '@/hooks/questions/useAIKnowledge';
import { useReferenceFrameworks } from '@/hooks/questions/useReferenceFrameworks';
import { useQuestionBatches } from '@/hooks/questions/useQuestionBatches';
import { useGenerationPeriods } from '@/hooks/questions/useGenerationPeriods';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantIdQuery } from '@/hooks/admin/useTenantIdQuery';
import { usePromptRewrite } from '@/hooks/admin/usePromptRewrite';
import type { QuestionPurpose } from '@/components/ai-generator/ConfigPanel';
import type { AIGeneratorState } from '../types';

export function useAIGenerator(): AIGeneratorState {
  const { t } = useTranslation();
  const { user } = useAuth();

  // ─── Service hooks ───────────────────────────────────
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
    isGenerating, regeneratingIndex, isValidating, isSaving, isSavingWellness,
  } = useEnhancedAIGeneration();

  const { data: tenantId } = useTenantIdQuery(user?.id);
  const { rewritePrompt: rewritePromptFn, isRewriting } = usePromptRewrite();

  const { availableBatches, availableWellnessBatches, MAX_BATCH_SIZE } = useQuestionBatches(tenantId || null);
  const { moods: moodDefinitions } = useMoodDefinitions(tenantId || null);
  const {
    periods, createPeriodAsync, isCreating: isCreatingPeriod,
    getActivePeriodForPurpose, expirePeriod, softDeletePeriod,
  } = useGenerationPeriods(tenantId || null);

  // ─── Local state ─────────────────────────────────────
  const [accuracyMode, setAccuracyMode] = useState<string>(DEFAULT_ACCURACY_MODE);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_AI_MODEL);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_AI_SETTINGS.questionCount);
  const [complexity, setComplexity] = useState<string>(DEFAULT_AI_SETTINGS.complexity);
  const [tone, setTone] = useState<string>(DEFAULT_AI_SETTINGS.tone);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    requireExplanation: DEFAULT_AI_SETTINGS.requireExplanation,
    enableBiasDetection: DEFAULT_AI_SETTINGS.enableBiasDetection,
    enableAmbiguityDetection: DEFAULT_AI_SETTINGS.enableAmbiguityDetection,
    enableDuplicateDetection: DEFAULT_AI_SETTINGS.enableDuplicateDetection,
    enableCriticPass: DEFAULT_AI_SETTINGS.enableCriticPass,
    minWordLength: DEFAULT_AI_SETTINGS.minWordLength,
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedMoodLevels, setSelectedMoodLevels] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [wellnessPreviewOpen, setWellnessPreviewOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<QuestionPurpose>('survey');
  const [questionsPerDay, setQuestionsPerDay] = useState(1);

  // ─── Derived (memoized) ──────────────────────────────
  const isStrict = accuracyMode === 'strict';
  const hasFailures = validationReport?.overall_result === 'failed';
  const canSave = questions.length > 0 && !(isStrict && hasFailures);
  const canExport = canSave;

  // ─── Helpers (memoized) ─────────────────────────────
  const activeDocIds = useMemo(() => documents.filter(d => d.is_active).map(d => d.id), [documents]);
  const resolvedType = useMemo(() => questionTypes.length === 0 ? 'mixed' : questionTypes.join(', '), [questionTypes]);

  // ─── Actions (stabilized with useCallback) ──────────
  const handleGenerate = useCallback(() => {
    if (selectedCategoryIds.length === 0) {
      toast.error(t('aiGenerator.selectAtLeastOneCategory'));
      return;
    }
    if (!selectedModel) {
      toast.error(t('aiGenerator.selectModel'));
      return;
    }
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
      periodId: selectedPeriodId || undefined,
    });
  }, [selectedCategoryIds, selectedModel, generate, questionCount, complexity, tone, resolvedType, accuracyMode, advancedSettings, activeDocIds, customPrompt, selectedFrameworkIds, selectedSubcategoryIds, purpose, selectedMoodLevels, selectedPeriodId, t]);

  const handleRewritePrompt = useCallback(async () => {
    if (customPrompt.trim().length < 10) return;
    const activeDocs = documents.filter(d => d.is_active && d.content_text);
    const documentSummaries = activeDocs
      .map(d => `[${d.file_name}]: ${(d.content_text || '').substring(0, 400)}`)
      .join('\n')
      .substring(0, 2000);
    const result = await rewritePromptFn({
      prompt: customPrompt,
      model: selectedModel,
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      selectedFrameworkIds: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      documentSummaries: documentSummaries || undefined,
    });
    if (result) setCustomPrompt(result);
  }, [customPrompt, documents, selectedModel, selectedFrameworkIds, rewritePromptFn]);

  const handleValidate = useCallback(() => {
    validate({
      questions, accuracyMode,
      model: selectedModel,
      enableCriticPass: advancedSettings.enableCriticPass,
      minWordLength: advancedSettings.minWordLength,
      selectedFrameworkIds: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      hasDocuments: documents.length > 0,
      periodId: selectedPeriodId || undefined,
    });
  }, [validate, questions, accuracyMode, selectedModel, advancedSettings, selectedFrameworkIds, activeDocIds, documents, selectedPeriodId]);

  const handleSaveClick = useCallback(() => {
    if (purpose === 'wellness') {
      setWellnessPreviewOpen(true);
    } else {
      setBatchDialogOpen(true);
    }
  }, [purpose]);

  const handleWellnessConfirm = useCallback((targetBatchId?: string) => {
    saveWellness({ questions, targetBatchId }, {
      onSuccess: () => {
        setWellnessPreviewOpen(false);
        clearAll();
        if (documents.length > 0) deleteAllDocuments();
      },
    });
  }, [saveWellness, questions, clearAll, documents, deleteAllDocuments]);

  const handleBatchConfirm = useCallback((targetBatchId?: string) => {
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
  }, [saveSet, questions, selectedModel, accuracyMode, questionCount, complexity, tone, questionTypes, advancedSettings, selectedFrameworkIds, customPrompt, selectedCategoryIds, selectedSubcategoryIds, validationReport, clearAll, documents, deleteAllDocuments]);

  const handleExport = useCallback((format: 'json' | 'pdf') => {
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
        category_id: q.category_id || null,
        subcategory_id: q.subcategory_id || null,
        category_name: q.category_name || null,
        subcategory_name: q.subcategory_name || null,
        mood_score: q.mood_score || null,
        affective_state: q.affective_state || null,
        generation_period_id: q.generation_period_id || null,
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
  }, [selectedModel, accuracyMode, questionCount, complexity, tone, questionTypes, selectedFrameworkIds, selectedCategoryIds, selectedSubcategoryIds, validationReport, questions, t]);

  const handleRegenerateFailedOnly = useCallback(() => {
    const failedCount = questions.filter(q => q.validation_status === 'failed').length;
    if (failedCount === 0) return;
    generate({
      questionCount: failedCount, complexity, tone, questionType: resolvedType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      selectedFrameworks: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      categoryIds: selectedCategoryIds,
      subcategoryIds: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds : undefined,
      moodLevels: purpose === 'wellness' ? selectedMoodLevels : undefined,
      periodId: selectedPeriodId || undefined,
    });
  }, [questions, generate, complexity, tone, resolvedType, selectedModel, accuracyMode, advancedSettings, selectedFrameworkIds, activeDocIds, selectedCategoryIds, selectedSubcategoryIds, purpose, selectedMoodLevels, selectedPeriodId]);

  const handleRegenerateSingle = useCallback((index: number) => {
    const q = questions[index];
    const singleType = q.type || resolvedType;
    generate({
      questionCount: 1, complexity: q.complexity || complexity, tone: q.tone || tone, questionType: singleType,
      model: selectedModel, accuracyMode, advancedSettings, language: 'both',
      useExpertKnowledge: selectedFrameworkIds.length > 0,
      knowledgeDocumentIds: activeDocIds.length > 0 ? activeDocIds : undefined,
      selectedFrameworks: selectedFrameworkIds.length > 0 ? selectedFrameworkIds : undefined,
      categoryIds: selectedCategoryIds,
      subcategoryIds: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds : undefined,
      moodLevels: purpose === 'wellness' ? (q.mood_levels?.length ? q.mood_levels : selectedMoodLevels) : undefined,
      periodId: selectedPeriodId || undefined,
      _replaceAtIndex: index,
    } as any);
  }, [questions, generate, resolvedType, complexity, tone, selectedModel, accuracyMode, advancedSettings, selectedFrameworkIds, activeDocIds, selectedCategoryIds, selectedSubcategoryIds, purpose, selectedMoodLevels, selectedPeriodId]);

  const handleClearAll = useCallback(() => {
    clearAll();
    if (documents.length > 0) deleteAllDocuments();
  }, [clearAll, documents, deleteAllDocuments]);

  const handleCreatePeriod = useCallback(async (params: any) => {
    if (!tenantId) return;
    try {
      const newPeriod = await createPeriodAsync({
        tenantId,
        periodType: params.periodType,
        startDate: params.startDate,
        endDate: params.endDate,
        lockedCategoryIds: params.lockedCategoryIds,
        lockedSubcategoryIds: params.lockedSubcategoryIds,
        purpose: params.purpose || purpose,
        createdBy: user?.id,
      });
      if (newPeriod?.id) {
        setSelectedPeriodId(newPeriod.id);
        const catIds = (newPeriod.locked_category_ids as string[]) || [];
        const subIds = (newPeriod.locked_subcategory_ids as string[]) || [];
        setSelectedCategoryIds(catIds);
        setSelectedSubcategoryIds(subIds);
      }
    } catch {
      // Error already handled by mutation onError
    }
  }, [tenantId, createPeriodAsync, purpose, user?.id]);

  const handleExpirePeriod = useCallback((periodId: string) => {
    expirePeriod(periodId);
    if (selectedPeriodId === periodId) setSelectedPeriodId(null);
  }, [expirePeriod, selectedPeriodId]);

  const handleDeletePeriod = useCallback((periodId: string) => {
    softDeletePeriod(periodId);
    if (selectedPeriodId === periodId) setSelectedPeriodId(null);
  }, [softDeletePeriod, selectedPeriodId]);

  return {
    // Config state
    accuracyMode, setAccuracyMode,
    selectedModel, setSelectedModel,
    questionTypes, setQuestionTypes,
    questionCount, setQuestionCount,
    complexity, setComplexity,
    tone, setTone,
    advancedSettings, setAdvancedSettings,
    customPrompt, setCustomPrompt,
    selectedFrameworkIds, setSelectedFrameworkIds,
    selectedCategoryIds, setSelectedCategoryIds,
    selectedSubcategoryIds, setSelectedSubcategoryIds,
    selectedMoodLevels, setSelectedMoodLevels,
    selectedPeriodId, setSelectedPeriodId,
    purpose, setPurpose,
    questionsPerDay, setQuestionsPerDay,
    batchDialogOpen, setBatchDialogOpen,
    wellnessPreviewOpen, setWellnessPreviewOpen,

    // Derived
    isStrict, hasFailures, canSave, canExport,

    // Data
    models, documents, referenceFrameworks, frameworksLoading,
    questions, validationReport, generationMeta,
    availableBatches, availableWellnessBatches, MAX_BATCH_SIZE,
    moodDefinitions, periods,
    tenantId: tenantId || null,
    currentUserId: user?.id,

    // Loading
    isGenerating, regeneratingIndex, isValidating, isSaving, isSavingWellness, isUploading, isRewriting, isCreatingPeriod,

    // Actions
    handleGenerate, handleRewritePrompt, handleValidate,
    handleSaveClick, handleWellnessConfirm, handleBatchConfirm,
    handleExport, handleRegenerateFailedOnly, handleRegenerateSingle,
    handleClearAll, removeQuestion, updateQuestion,
    uploadDocument, toggleDocument, deleteDocument,
    addFramework, updateFramework, deleteFramework,
    activePeriodForPurpose: getActivePeriodForPurpose(purpose),
    handleExpirePeriod, handleDeletePeriod, handleCreatePeriod,
  };
}
