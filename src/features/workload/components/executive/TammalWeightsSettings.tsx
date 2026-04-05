import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { cardVariants } from '@/theme/tokens';

const KEYS = ['alignment', 'velocity', 'capacity', 'burnout'] as const;

export function TammalWeightsSettings() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: weights } = useQuery({
    queryKey: ['tammal-weights', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('tammal_weights')
        .eq('id', tenantId!)
        .single();
      return (data?.tammal_weights as Record<string, number>) ?? { alignment: 25, velocity: 25, capacity: 25, burnout: 25 };
    },
    enabled: !!tenantId,
  });

  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState<Record<string, number>>({ alignment: 25, velocity: 25, capacity: 25, burnout: 25 });

  const startEdit = () => {
    setLocal(weights ?? { alignment: 25, velocity: 25, capacity: 25, burnout: 25 });
    setEditing(true);
  };

  const sum = KEYS.reduce((s, k) => s + (local[k] ?? 0), 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tenants')
        .update({ tammal_weights: local } as any)
        .eq('id', tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tammal-weights'] });
      toast.success(t('executive.tammalWeights.saved'));
      setEditing(false);
    },
    onError: () => toast.error(t('common.error')),
  });

  if (!weights) return null;

  return (
    <Card className={cn(cardVariants.glass, 'shadow-sm')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          {t('executive.tammalWeights.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {KEYS.map(k => (
                <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{t(`executive.tammal.${k}`)}</span>
                  <span className="text-sm font-bold">{weights[k] ?? 25}%</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-2">
              <Settings2 className="h-3.5 w-3.5" />{t('executive.tammalWeights.customize')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {KEYS.map(k => (
              <div key={k} className="flex items-center gap-3">
                <Label className="flex-1 text-sm">{t(`executive.tammal.${k}`)}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={local[k]}
                  onChange={e => setLocal(prev => ({ ...prev, [k]: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            ))}
            <div className={`text-xs font-medium ${sum === 100 ? 'text-chart-2' : 'text-destructive'}`}>
              {t('executive.tammalWeights.sum')}: {sum}%
              {sum !== 100 && ` (${t('executive.tammalWeights.mustEqual100')})`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={sum !== 100 || saveMutation.isPending}>
                {saveMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
