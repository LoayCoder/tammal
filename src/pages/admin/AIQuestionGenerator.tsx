/**
 * AI Question Generator — thin page orchestrator.
 * All state and business logic lives in useAIGenerator.
 * This file only composes UI components.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/shared/loading/Skeletons';
import { EmptyState } from '@/shared/empty/EmptyState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TopControlBar } from '@/components/ai-generator/TopControlBar';
import { ConfigPanel } from '@/components/ai-generator/ConfigPanel';
import { QuestionCard } from '@/components/ai-generator/QuestionCard';
import { ValidationReport } from '@/components/ai-generator/ValidationReport';
import { BatchSaveDialog } from '@/components/ai-generator/BatchSaveDialog';
import { WellnessSavePreviewDialog } from '@/components/ai-generator/WellnessSavePreviewDialog';
import { useAIGenerator, GeneratorProvider } from '@/features/ai-generator';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

export default function AIQuestionGenerator() {
  const { t } = useTranslation();
  const g = useAIGenerator();

    return (
      <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}>
      <GeneratorProvider state={g}>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('aiGenerator.title')}</h1>
          <p className="text-muted-foreground">{t('aiGenerator.subtitle')}</p>
        </div>

        <div className="glass-card border-0 rounded-xl">
          <TopControlBar
            accuracyMode={g.accuracyMode}
            onAccuracyModeChange={g.setAccuracyMode}
            selectedModel={g.selectedModel}
            onModelChange={g.setSelectedModel}
            models={g.models}
            onSave={g.handleSaveClick}
            onExport={g.handleExport}
            canSave={g.canSave}
            canExport={g.canExport}
            isSaving={g.isSaving || g.isSavingWellness}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ConfigPanel />
          </div>

          <div className="lg:col-span-3 space-y-4">
            {g.isStrict && g.hasFailures && g.questions.length > 0 && (
              <Alert variant="destructive" className="glass-card border-0 rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{t('aiGenerator.strictModeMessage')}</AlertDescription>
              </Alert>
            )}

            {(g.isGenerating && g.regeneratingIndex === null) ? (
              <div className="glass-card border-0 rounded-xl p-6">
                <SkeletonList rows={3} />
              </div>
            ) : g.questions.length === 0 ? (
              <div className="glass-card border-0 rounded-xl py-4">
                <EmptyState
                  icon={<Sparkles className="h-16 w-16 text-muted-foreground/30" />}
                  title={t('aiGenerator.emptyTitle')}
                  description={t('aiGenerator.emptyDescription')}
                />
              </div>
            ) : (
              <>
                <div className="glass-card border-0 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground px-2">
                    {t('aiGenerator.questionsGenerated', { count: g.questions.length })}
                    {g.generationMeta && ` • ${g.generationMeta.duration_ms}ms`}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={g.handleValidate} disabled={g.isValidating}>
                      {g.isValidating ? <RefreshCw className="h-4 w-4 animate-spin me-1" /> : <ShieldCheck className="h-4 w-4 me-1" />}
                      {t('aiGenerator.runValidation')}
                    </Button>
                    {g.isStrict && g.hasFailures && (
                      <Button variant="outline" size="sm" onClick={g.handleRegenerateFailedOnly}>
                        <RefreshCw className="h-4 w-4 me-1" />
                        {t('aiGenerator.regenerateFailed')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={g.handleClearAll}>
                      {t('aiGenerator.clearAll')}
                    </Button>
                  </div>
                </div>

                {g.validationReport && (
                  <ValidationReport report={g.validationReport} isStrictMode={g.isStrict} />
                )}

                <div className="space-y-3">
                  {g.questions.map((q, i) => (
                    <QuestionCard key={i} question={q} index={i} onRemove={g.removeQuestion} onUpdate={g.updateQuestion} onRegenerate={g.handleRegenerateSingle} selectedModel={g.selectedModel} purpose={g.purpose} moodDefinitions={g.moodDefinitions} isRegenerating={g.regeneratingIndex === i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <BatchSaveDialog
          open={g.batchDialogOpen}
          onOpenChange={g.setBatchDialogOpen}
          availableBatches={g.availableBatches}
          questionCount={g.questions.length}
          maxBatchSize={g.MAX_BATCH_SIZE}
          onConfirm={g.handleBatchConfirm}
          isSaving={g.isSaving}
        />

        <WellnessSavePreviewDialog
          open={g.wellnessPreviewOpen}
          onOpenChange={g.setWellnessPreviewOpen}
          questions={g.questions}
          onConfirm={g.handleWellnessConfirm}
          isSaving={g.isSavingWellness}
          availableBatches={g.availableWellnessBatches}
          maxBatchSize={g.MAX_BATCH_SIZE}
        />
      </div>
    </GeneratorProvider>
      </ErrorBoundary>
  );
}
