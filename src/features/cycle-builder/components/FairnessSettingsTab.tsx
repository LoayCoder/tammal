import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { FairnessSettings } from '../types';

interface Props {
  fairness: FairnessSettings;
  updateFairness: <K extends keyof FairnessSettings>(key: K, value: FairnessSettings[K]) => void;
  onNext: () => void;
}

export const FairnessSettingsTab = React.memo(function FairnessSettingsTab({
  fairness, updateFairness, onNext,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('recognition.fairness.cliqueThreshold')}: {(fairness.cliqueThreshold * 100).toFixed(0)}%</Label>
        <Slider value={[fairness.cliqueThreshold * 100]} onValueChange={([v]) => updateFairness('cliqueThreshold', v / 100)} min={10} max={90} step={5} />
      </div>
      <div className="space-y-2">
        <Label>{t('recognition.fairness.demographicParity')}: {(fairness.demographicParityTarget * 100).toFixed(0)}%</Label>
        <Slider value={[fairness.demographicParityTarget * 100]} onValueChange={([v]) => updateFairness('demographicParityTarget', v / 100)} min={50} max={100} step={5} />
      </div>
      <div className="flex items-center justify-between">
        <Label>{t('recognition.fairness.visibilityBias')}</Label>
        <Switch checked={fairness.visibilityBiasCorrection} onCheckedChange={(v) => updateFairness('visibilityBiasCorrection', v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>{t('recognition.fairness.publishRawScores')}</Label>
        <Switch checked={fairness.publishRawScores} onCheckedChange={(v) => updateFairness('publishRawScores', v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>{t('recognition.fairness.allowAppeals')}</Label>
        <Switch checked={fairness.allowAppeals} onCheckedChange={(v) => updateFairness('allowAppeals', v)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext}>{t('common.next')}</Button>
      </div>
    </div>
  );
});
