import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useJudgingCriteria, type CreateCriterionInput, type JudgingCriterion } from '@/hooks/recognition/useJudgingCriteria';

interface CriteriaEditorProps {
  themeId: string;
}

export function CriteriaEditor({ themeId }: CriteriaEditorProps) {
  const { t } = useTranslation();
  const { criteria, isPending: isLoading, createCriterion, updateCriterion, deleteCriterion } = useJudgingCriteria(themeId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(0.25);
  const [newDescription, setNewDescription] = useState('');

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);

  const handleAdd = () => {
    createCriterion.mutate({
      theme_id: themeId,
      name: newName,
      weight: newWeight,
      description: newDescription,
      sort_order: criteria.length,
    }, {
      onSuccess: () => {
        setAdding(false);
        setNewName('');
        setNewWeight(0.25);
        setNewDescription('');
      },
    });
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{t('recognition.criteria.title')}</h4>
          <p className="text-xs text-muted-foreground">
            {t('recognition.criteria.totalWeight')}: {(totalWeight * 100).toFixed(0)}%
            {Math.abs(totalWeight - 1) > 0.01 && (
              <span className="text-destructive ms-2">({t('recognition.criteria.mustEqual100')})</span>
            )}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 me-1" />
          {t('recognition.criteria.add')}
        </Button>
      </div>

      {criteria.map((criterion) => (
        <Card key={criterion.id} className="border">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0 cursor-grab" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{criterion.name}</span>
                  <span className="text-xs text-muted-foreground">{(Number(criterion.weight) * 100).toFixed(0)}%</span>
                </div>
                {criterion.description && (
                  <p className="text-xs text-muted-foreground">{criterion.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteCriterion.mutate(criterion.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {adding && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label>{t('recognition.criteria.name')}</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('recognition.criteria.namePlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('recognition.criteria.description')}</Label>
              <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>{t('recognition.criteria.weight')}: {(newWeight * 100).toFixed(0)}%</Label>
              <Slider value={[newWeight * 100]} onValueChange={([v]) => setNewWeight(v / 100)} min={5} max={100} step={5} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleAdd} disabled={!newName || createCriterion.isPending}>{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
