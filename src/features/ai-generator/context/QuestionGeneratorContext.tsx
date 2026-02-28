/**
 * QuestionGeneratorContext — provides all AI generator config state to the subtree.
 * Eliminates prop drilling through ConfigPanel (48 → 0 props).
 *
 * The context value is memoized to prevent cascade re-renders when
 * unrelated parent state changes.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AIGeneratorState } from '../types';

const GeneratorContext = createContext<AIGeneratorState | null>(null);

export function GeneratorProvider({ state, children }: { state: AIGeneratorState; children: ReactNode }) {
  // Memoize the context value so consumers only re-render when state identity changes.
  // useAIGenerator returns a new object each render, but the individual fields are stable
  // thanks to useState identity. We rely on the parent hook's memoization.
  const value = useMemo(() => state, [
    // Config state
    state.accuracyMode, state.selectedModel, state.questionTypes,
    state.questionCount, state.complexity, state.tone,
    state.advancedSettings, state.customPrompt,
    state.selectedFrameworkIds, state.selectedCategoryIds,
    state.selectedSubcategoryIds, state.selectedMoodLevels,
    state.selectedPeriodId, state.purpose, state.questionsPerDay,
    state.batchDialogOpen, state.wellnessPreviewOpen,
    // Derived
    state.isStrict, state.hasFailures, state.canSave, state.canExport,
    // Data (reference equality from React Query)
    state.models, state.documents, state.referenceFrameworks,
    state.questions, state.validationReport, state.generationMeta,
    state.availableBatches, state.availableWellnessBatches,
    state.moodDefinitions, state.periods, state.tenantId,
    // Loading
    state.isGenerating, state.regeneratingIndex, state.isValidating,
    state.isSaving, state.isSavingWellness, state.isUploading,
    state.isRewriting, state.isCreatingPeriod,
  ]);

  return <GeneratorContext.Provider value={value}>{children}</GeneratorContext.Provider>;
}

export function useGeneratorContext(): AIGeneratorState {
  const ctx = useContext(GeneratorContext);
  if (!ctx) throw new Error('useGeneratorContext must be used within <GeneratorProvider>');
  return ctx;
}
