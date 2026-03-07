import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAwardCycles, type AwardCycle } from '@/hooks/recognition/useAwardCycles';
import { ThemeBuilder } from '@/components/recognition/ThemeBuilder';
import { getImpactWarning } from '@/lib/recognition-utils';
import type { FairnessSettings, FairnessConfig } from '@/features/cycle-builder/types';
import { buildFairnessConfig } from '@/features/cycle-builder/types';

interface CycleEditDialogProps {
  cycle: AwardCycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditTab = 'basics' | 'themes' | 'fairness';

const DEFAULT_FAIRNESS: FairnessSettings = {
  cliqueThreshold: 0.4,
  demographicParityTarget: 0.8,
  visibilityBiasCorrection: true,
  publishRawScores: true,
  allowAppeals: true,
  votingWeightAdjustmentLimit: 30,
};

function parseFairnessConfig(config: Record<string, any> | null): FairnessSettings {
  if (!config) return { ...DEFAULT_FAIRNESS };
  const fc = config as Record<string, any>;
  const bd = (fc.biasDetection ?? {}) as Record<string, any>;
  const au = (fc.auditSettings ?? {}) as Record<string, any>;
  return {
    cliqueThreshold: (bd.cliqueThreshold as number) ?? DEFAULT_FAIRNESS.cliqueThreshold,
    demographicParityTarget: (bd.demographicParityTarget as number) ?? DEFAULT_FAIRNESS.demographicParityTarget,
    visibilityBiasCorrection: (bd.visibilityBiasCorrection as boolean) ?? DEFAULT_FAIRNESS.visibilityBiasCorrection,
    publishRawScores: (au.publishRawScores as boolean) ?? DEFAULT_FAIRNESS.publishRawScores,
    allowAppeals: (au.allowAppeals as boolean) ?? DEFAULT_FAIRNESS.allowAppeals,
    votingWeightAdjustmentLimit: (fc.votingWeightAdjustmentLimit as number) ?? DEFAULT_FAIRNESS.votingWeightAdjustmentLimit,
  };
}

export const CycleEditDialog = React.memo(function CycleEditDialog({
  cycle,
  open,
  onOpenChange,
}: CycleEditDialogProps) {
  const { t } = useTranslation();
  const { updateCycle } = useAwardCycles();
  const [activeTab, setActiveTab] = useState<EditTab>('basics');

  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    nomination_start: '',
    nomination_end: '',
    peer_endorsement_end: '',
    voting_start: '',
    voting_end: '',
    announcement_date: '',
    audit_review_days: 3,
  });

  const [fairness, setFairness] = useState<FairnessSettings>({ ...DEFAULT_FAIRNESS });

  useEffect(() => {
    if (cycle) {
      setForm({
        name: cycle.name,
        name_ar: cycle.name_ar ?? '',
        nomination_start: cycle.nomination_start?.slice(0, 16) ?? '',
        nomination_end: cycle.nomination_end?.slice(0, 16) ?? '',
        peer_endorsement_end: cycle.peer_endorsement_end?.slice(0, 16) ?? '',
        voting_start: cycle.voting_start?.slice(0, 16) ?? '',
        voting_end: cycle.voting_end?.slice(0, 16) ?? '',
        announcement_date: cycle.announcement_date?.slice(0, 16) ?? '',
        audit_review_days: cycle.audit_review_days ?? 3,
      });
      setFairness(parseFairnessConfig(cycle.fairness_config));
      setActiveTab('basics');
    }
  }, [cycle]);

  const updateField = useCallback((key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateFairnessField = useCallback(<K extends keyof FairnessSettings>(key: K, value: FairnessSettings[K]) => {
    setFairness((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!cycle) return null;

  const isInProcess = cycle.status !== 'configuring';
  const impactWarning = getImpactWarning(cycle.status, t);

  const handleSave = () => {
    const fairnessConfig = buildFairnessConfig(fairness);
    updateCycle.mutate(
      {
        id: cycle.id,
        ...form,
        name_ar: form.name_ar || null,
        fairness_config: fairnessConfig,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('recognition.cycles.editCycle')}</DialogTitle>
        </DialogHeader>

        {isInProcess && impactWarning && (
          <Alert variant="destructive" className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('recognition.cycles.impactAlert.title')}</AlertTitle>
            <AlertDescription>{impactWarning}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="basics">{t('recognition.cycleBuilder.basics')}</TabsTrigger>
            <TabsTrigger value="themes">{t('recognition.cycleBuilder.themes')}</TabsTrigger>
            <TabsTrigger value="fairness">{t('recognition.cycleBuilder.fairness')}</TabsTrigger>
          </TabsList>

          {/* ── Basics Tab ── */}
          <TabsContent value="basics" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t('recognition.cycles.name')}</Label>
                <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.cycles.nameAr')}</Label>
                <Input value={form.name_ar} onChange={(e) => updateField('name_ar', e.target.value)} dir="rtl" />
              </div>
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
            <div className="space-y-1 max-w-xs">
              <Label>{t('recognition.cycles.auditDays')}</Label>
              <Input type="number" min={1} max={14} value={form.audit_review_days} onChange={(e) => updateField('audit_review_days', parseInt(e.target.value, 10) || 1)} />
            </div>
          </TabsContent>

          {/* ── Themes Tab ── */}
          <TabsContent value="themes" className="mt-0">
            <ThemeBuilder cycleId={cycle.id} />
          </TabsContent>

          {/* ── Fairness Tab ── */}
          <TabsContent value="fairness" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label>{t('recognition.fairness.cliqueThreshold')}: {(fairness.cliqueThreshold * 100).toFixed(0)}%</Label>
              <Slider value={[fairness.cliqueThreshold * 100]} onValueChange={([v]) => updateFairnessField('cliqueThreshold', v / 100)} min={10} max={90} step={5} />
            </div>
            <div className="space-y-2">
              <Label>{t('recognition.fairness.demographicParity')}: {(fairness.demographicParityTarget * 100).toFixed(0)}%</Label>
              <Slider value={[fairness.demographicParityTarget * 100]} onValueChange={([v]) => updateFairnessField('demographicParityTarget', v / 100)} min={50} max={100} step={5} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.visibilityBias')}</Label>
              <Switch checked={fairness.visibilityBiasCorrection} onCheckedChange={(v) => updateFairnessField('visibilityBiasCorrection', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.publishRawScores')}</Label>
              <Switch checked={fairness.publishRawScores} onCheckedChange={(v) => updateFairnessField('publishRawScores', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('recognition.fairness.allowAppeals')}</Label>
              <Switch checked={fairness.allowAppeals} onCheckedChange={(v) => updateFairnessField('allowAppeals', v)} />
            </div>
            <div className="space-y-2">
              <Label>{t('recognition.fairness.votingWeightAdjustmentLimit')}: ±{fairness.votingWeightAdjustmentLimit}%</Label>
              <Slider
                value={[fairness.votingWeightAdjustmentLimit]}
                onValueChange={([v]) => updateFairnessField('votingWeightAdjustmentLimit', v)}
                min={0}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground">{t('recognition.fairness.votingWeightAdjustmentLimitDesc')}</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!form.name || updateCycle.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
