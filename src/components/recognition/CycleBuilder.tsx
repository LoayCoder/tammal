import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import {
  useCycleBuilder,
  TabsNav,
  CycleBasicsTab,
  FairnessSettingsTab,
  ThemeBuilderTab,
  ReviewAndCreateTab,
} from '@/features/cycle-builder';

interface CycleBuilderProps {
  onClose: () => void;
}

export function CycleBuilder({ onClose }: CycleBuilderProps) {
  const { t } = useTranslation();
  const {
    step, setStep,
    createdCycleId,
    form, updateField,
    fairness, updateFairness,
    basicsValid, isCreating,
    handleCreateCycle,
    goToFairness, goToReview,
  } = useCycleBuilder(onClose);

  return (
    <ErrorBoundary title={t('common.sectionError', 'Section error')}>
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t('recognition.cycleBuilder.title')}</CardTitle>
        <CardDescription>{t('recognition.cycleBuilder.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
          <TabsNav createdCycleId={createdCycleId} />

          <TabsContent value="basics">
            <CycleBasicsTab
              form={form}
              updateField={updateField}
              basicsValid={basicsValid}
              isCreating={isCreating}
              onCreateCycle={handleCreateCycle}
            />
          </TabsContent>

          <TabsContent value="themes">
            <ThemeBuilderTab cycleId={createdCycleId} onNext={goToFairness} />
          </TabsContent>

          <TabsContent value="fairness">
            <FairnessSettingsTab
              fairness={fairness}
              updateFairness={updateFairness}
              onNext={goToReview}
            />
          </TabsContent>

          <TabsContent value="review">
            <ReviewAndCreateTab cycleName={form.name} onClose={onClose} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </ErrorBoundary>
  );
}
