import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useUpdateBudget } from '@/hooks/ai-governance/useGovernanceActions';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  budgetConfig: Record<string, unknown> | null;
}

export function BudgetControls({ budgetConfig }: Props) {
  const { t } = useTranslation();
  const updateBudget = useUpdateBudget();

  const [budget, setBudget] = useState(String((budgetConfig?.monthly_budget as number) ?? 0));
  const [softLimit, setSoftLimit] = useState(String((budgetConfig?.soft_limit_percentage as number) ?? 80));
  const [routingMode, setRoutingMode] = useState((budgetConfig?.routing_mode as string) ?? 'balanced');

  const handleSave = () => {
    updateBudget.mutate({
      monthly_budget: Number(budget),
      soft_limit_percentage: Number(softLimit),
      routing_mode: routingMode,
    }, {
      onSuccess: () => toast.success(t('aiGovernance.budgetUpdated')),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>{t('aiGovernance.budgetControls')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('aiGovernance.monthlyBudget')}</Label>
            <Input type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('aiGovernance.softLimitPct')}</Label>
            <Input type="number" min="0" max="100" value={softLimit} onChange={(e) => setSoftLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('aiGovernance.routingMode')}</Label>
            <Select value={routingMode} onValueChange={setRoutingMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="cost_saver">Cost Saver</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateBudget.isPending}>
          {updateBudget.isPending ? t('common.loading') : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
