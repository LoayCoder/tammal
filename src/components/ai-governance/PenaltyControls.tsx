import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { useApplyPenalty, useClearPenalty, usePenalties } from '@/hooks/ai-governance/useGovernanceActions';
import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function PenaltyControls() {
  const { t } = useTranslation();
  const applyPenalty = useApplyPenalty();
  const clearPenalty = useClearPenalty();
  const { data: penalties = [] } = usePenalties();

  const [provider, setProvider] = useState('');
  const [feature, setFeature] = useState('');
  const [duration, setDuration] = useState('10');
  const [multiplier, setMultiplier] = useState('0.7');

  const handleApply = () => {
    if (!provider || !feature) return toast.error(t('aiGovernance.providerFeatureRequired'));
    applyPenalty.mutate({
      provider, feature,
      duration_minutes: Number(duration),
      multiplier: Number(multiplier),
    }, {
      onSuccess: () => { toast.success(t('aiGovernance.penaltyApplied')); setProvider(''); setFeature(''); },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleClear = (penaltyId: string) => {
    clearPenalty.mutate({ penalty_id: penaltyId }, {
      onSuccess: () => toast.success(t('aiGovernance.penaltyCleared')),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>{t('aiGovernance.penaltyControls')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. openai" />
          </div>
          <div className="space-y-2">
            <Label>Feature</Label>
            <Input value={feature} onChange={(e) => setFeature(e.target.value)} placeholder="e.g. question_generation" />
          </div>
          <div className="space-y-2">
            <Label>{t('aiGovernance.durationMin')}</Label>
            <Input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Multiplier</Label>
            <Input type="number" min="0" max="1" step="0.1" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleApply} disabled={applyPenalty.isPending}>
          {t('aiGovernance.applyPenalty')}
        </Button>

        {penalties.length > 0 && (
          <div className="mt-4 space-y-2">
            {penalties.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm">{p.provider} / {p.feature} — {p.penalty_multiplier}x</span>
                <Button size="sm" variant="ghost" onClick={() => handleClear(p.id)} disabled={clearPenalty.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
