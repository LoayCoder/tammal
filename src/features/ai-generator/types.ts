/**
 * AI Question Generator feature types.
 * Re-exports shared types and defines feature-local ones.
 */

export type { EnhancedGeneratedQuestion, ValidationReport, AdvancedSettings, GenerateInput } from '@/hooks/questions/useEnhancedAIGeneration';
export type { QuestionPurpose } from '@/components/ai-generator/ConfigPanel';
export type { AIModel } from '@/hooks/questions/useAIModels';
export type { ReferenceFramework } from '@/hooks/questions/useReferenceFrameworks';

/** Shape returned by useAIGenerator for the page orchestrator */
export interface AIGeneratorState {
  // Config state
  accuracyMode: string;
  setAccuracyMode: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  questionTypes: string[];
  setQuestionTypes: (v: string[]) => void;
  questionCount: number;
  setQuestionCount: (v: number) => void;
  complexity: string;
  setComplexity: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  advancedSettings: import('@/hooks/questions/useEnhancedAIGeneration').AdvancedSettings;
  setAdvancedSettings: (v: import('@/hooks/questions/useEnhancedAIGeneration').AdvancedSettings) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  selectedFrameworkIds: string[];
  setSelectedFrameworkIds: (v: string[]) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (v: string[]) => void;
  selectedSubcategoryIds: string[];
  setSelectedSubcategoryIds: (v: string[]) => void;
  selectedMoodLevels: string[];
  setSelectedMoodLevels: (v: string[]) => void;
  selectedPeriodId: string | null;
  setSelectedPeriodId: (v: string | null) => void;
  purpose: import('@/components/ai-generator/ConfigPanel').QuestionPurpose;
  setPurpose: (v: import('@/components/ai-generator/ConfigPanel').QuestionPurpose) => void;
  questionsPerDay: number;
  setQuestionsPerDay: (v: number) => void;
  batchDialogOpen: boolean;
  setBatchDialogOpen: (v: boolean) => void;
  wellnessPreviewOpen: boolean;
  setWellnessPreviewOpen: (v: boolean) => void;

  // Derived
  isStrict: boolean;
  hasFailures: boolean;
  canSave: boolean;
  canExport: boolean;

  // Data
  models: import('@/hooks/questions/useAIModels').AIModel[];
  documents: any[];
  referenceFrameworks: import('@/hooks/questions/useReferenceFrameworks').ReferenceFramework[];
  frameworksLoading: boolean;
  questions: import('@/hooks/questions/useEnhancedAIGeneration').EnhancedGeneratedQuestion[];
  validationReport: import('@/hooks/questions/useEnhancedAIGeneration').ValidationReport | null;
  generationMeta: { model: string; duration_ms: number } | null;
  availableBatches: any[];
  availableWellnessBatches: any[];
  MAX_BATCH_SIZE: number;
  moodDefinitions: any[];
  periods: any[];
  tenantId: string | null;
  currentUserId: string | undefined;

  // Loading
  isGenerating: boolean;
  regeneratingIndex: number | null;
  isValidating: boolean;
  isSaving: boolean;
  isSavingWellness: boolean;
  isUploading: boolean;
  isRewriting: boolean;
  isCreatingPeriod: boolean;

  // Actions
  handleGenerate: () => void;
  handleRewritePrompt: () => Promise<void>;
  handleValidate: () => void;
  handleSaveClick: () => void;
  handleWellnessConfirm: (targetBatchId?: string) => void;
  handleBatchConfirm: (targetBatchId?: string) => void;
  handleExport: (format: 'json' | 'pdf') => void;
  handleRegenerateFailedOnly: () => void;
  handleRegenerateSingle: (index: number) => void;
  handleClearAll: () => void;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, updates: any) => void;
  uploadDocument: any;
  toggleDocument: any;
  deleteDocument: any;
  addFramework: any;
  updateFramework: any;
  deleteFramework: any;
  activePeriodForPurpose: any;
  handleExpirePeriod: (periodId: string) => void;
  handleDeletePeriod: (periodId: string) => void;
  handleCreatePeriod: (params: any) => Promise<void>;
}
