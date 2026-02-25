import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAwardCycles, type CreateCycleInput } from '@/hooks/recognition/useAwardCycles';
import { ThemeBuilder } from './ThemeBuilder';
import { CycleTimeline } from './CycleTimeline';

interface CycleBuilderProps {
  onClose: () => void;
}

export function CycleBuilder({ onClose }: CycleBuilderProps) {
  const { t } = useTranslation();
  const { createCycle } = useAwardCycles();
  const [step, setStep] = useState<'basics' | 'themes' | 'fairness' | 'review'>('basics');
  const [createdCycleId, setCreatedCycleId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCycleInput>({
    name: '',
    nomination_start: '',
    nomination_end: '',
    peer_endorsement_end: '',
    voting_start: '',
    voting_end: '',
    audit_review_days: 3,
    announcement_date: '',
  });

  const [fairness, setFairness] = useState({
    cliqueThreshold: 0.4,
    demographicParityTarget: 0.8,
    visibilityBiasCorrection: true,
    publishRawScores: true,
    allowAppeals: true,
  });

  const handleCreateCycle = () => {
    const fairnessConfig = {
      biasDetection: {
        cliqueThreshold: fairness.cliqueThreshold,
        demographicParityTarget: fairness.demographicParityTarget,
        visibilityBiasCorrection: fairness.visibilityBiasCorrection,
      },
      auditSettings: {
        publishRawScores: fairness.publishRawScores,
        allowAppeals: fairness.allowAppeals,
      },
    };
    createCycle.mutate({ ...form, fairness_config: fairnessConfig }, {
      onSuccess: (data) => {
        setCreatedCycleId(data.id);
        setStep('themes');
      },
    });
  };

  const updateField = (key: keyof CreateCycleInput, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isBasicsValid = form.name && form.nomination_start && form.nomination_end &&
    form.peer_endorsement_end && form.voting_start && form.voting_end && form.announcement_date;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t('recognition.cycleBuilder.title')}</CardTitle>
        <CardDescription>{t('recognition.cycleBuilder.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basics">{t('recognition.cycleBuilder.basics')}</TabsTrigger>
            <TabsTrigger value="themes" disabled={!createdCycleId}>{t('recognition.cycleBuilder.themes')}</TabsTrigger>
            <TabsTrigger value="fairness" disabled={!createdCycleId}>{t('recognition.cycleBuilder.fairness')}</TabsTrigger>
            <TabsTrigger value="review" disabled={!createdCycleId}>{t('recognition.cycleBuilder.review')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <div className="space-y-1">
              <Label>{t('recognition.cycles.name')}</Label>
              <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t('recognition.timeline.nominationStart')}</Label>
                <Input type="datetime-local" value={form.nomination_start} onChange={(e) => updateField('nomination_start', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.timeline.nominationEnd')}</Label>
                <Input type="datetime-local" value={form.nomination_end} onChange={(e) => updateField('nomination_end', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.timeline.endorsementEnd')}</Label>
                <Input type="datetime-local" value={form.peer_endorsement_end} onChange={(e) => updateField('peer_endorsement_end', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.timeline.votingStart')}</Label>
                <Input type="datetime-local" value={form.voting_start} onChange={(e) => updateField('voting_start', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.timeline.votingEnd')}</Label>
                <Input type="datetime-local" value={form.voting_end} onChange={(e) => updateField('voting_end', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.timeline.announcement')}</Label>
                <Input type="datetime-local" value={form.announcement_date} onChange={(e) => updateField('announcement_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('recognition.cycles.auditDays')}</Label>
              <Input type="number" min={1} max={14} value={form.audit_review_days} onChange={(e) => updateField('audit_review_days', parseInt(e.target.value))} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateCycle} disabled={!isBasicsValid || createCycle.isPending}>
                {t('recognition.cycleBuilder.createAndContinue')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="themes">
            {createdCycleId && <ThemeBuilder cycleId={createdCycleId} />}
            <div className="flex justify-end mt-4">
              <Button onClick={() => setStep('fairness')}>{t('common.next')}</Button>
            </div>
          </TabsContent>

          <TabsContent value="fairness" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('recognition.fairness.cliqueThreshold')}: {(fairness.cliqueThreshold * 100).toFixed(0)}%</Label>
              <Slider value={[fairness.cliqueThreshold * 100]} onValueChange={([v]) => setFairness(p => ({ ...p, cliqueThreshold: v / 100 }))} min={10} max={90} step={5} />
            </div>
            <div className="space-y-2">
              <Label>{t('recognition.fairness.demographicParity')}: {(fairness.demographicParityTarget * 100).toFixed(0)}%</Label>
              <Slider value={[fairness.demographicParityTarget * 100]} onValueChange={([v]) => setFairness(p => ({ ...p, demographicParityTarget: v / 100 }))} min={50} max={100} step={5} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.visibilityBias')}</Label>
              <Switch checked={fairness.visibilityBiasCorrection} onCheckedChange={(v) => setFairness(p => ({ ...p, visibilityBiasCorrection: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.publishRawScores')}</Label>
              <Switch checked={fairness.publishRawScores} onCheckedChange={(v) => setFairness(p => ({ ...p, publishRawScores: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.allowAppeals')}</Label>
              <Switch checked={fairness.allowAppeals} onCheckedChange={(v) => setFairness(p => ({ ...p, allowAppeals: v }))} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep('review')}>{t('common.next')}</Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{form.name}</h3>
              <p className="text-sm text-muted-foreground">{t('recognition.cycleBuilder.reviewNote')}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>{t('common.done')}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
