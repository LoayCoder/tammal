import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useSwitchStrategy, useResetPosterior, useRefreshSummary } from '@/hooks/ai-governance/useGovernanceActions';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  currentStrategy: string;
}

export function StrategyControls({ currentStrategy }: Props) {
  const { t } = useTranslation();
  const switchStrategy = useSwitchStrategy();
  const resetPosterior = useResetPosterior();
  const refreshSummary = useRefreshSummary();

  const [strategy, setStrategy] = useState(currentStrategy);
  const [resetProvider, setResetProvider] = useState('');
  const [resetFeature, setResetFeature] = useState('');

  const handleSwitch = () => {
    switchStrategy.mutate({ strategy }, {
      onSuccess: () => toast.success(t('aiGovernance.strategySwitched')),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleReset = () => {
    if (!resetProvider || !resetFeature) return toast.error(t('aiGovernance.providerFeatureRequired'));
    resetPosterior.mutate({ provider: resetProvider, feature: resetFeature }, {
      onSuccess: () => { toast.success(t('aiGovernance.posteriorReset')); setResetProvider(''); setResetFeature(''); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.strategySwitch')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>{t('aiGovernance.routingStrategy')}</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cost_aware">Cost Aware</SelectItem>
                  <SelectItem value="thompson">Thompson Sampling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSwitch} disabled={switchStrategy.isPending}>
              {t('aiGovernance.switchStrategy')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t('aiGovernance.resetPosterior')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('aiGovernance.resetPosteriorWarning')}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={resetProvider} onChange={(e) => setResetProvider(e.target.value)} placeholder="e.g. openai" />
            </div>
            <div className="space-y-2">
              <Label>Feature</Label>
              <Input value={resetFeature} onChange={(e) => setResetFeature(e.target.value)} placeholder="e.g. question_generation" />
            </div>
          </div>
          <Button variant="destructive" onClick={handleReset} disabled={resetPosterior.isPending}>
            {t('aiGovernance.resetPosterior')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={() => refreshSummary.mutate({})} disabled={refreshSummary.isPending}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t('aiGovernance.refreshSummary')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
