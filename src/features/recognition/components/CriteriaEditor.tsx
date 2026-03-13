import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Slider } from '@/shared/components/ui/slider';
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import { useJudgingCriteria, type JudgingCriterion } from '@/features/recognition/hooks/recognition/useJudgingCriteria';

interface CriteriaEditorProps {
  themeId: string;
}

export function CriteriaEditor({ themeId }: CriteriaEditorProps) {
  const { t } = useTranslation();
  const { criteria, isPending: isLoading, createCriterion, updateCriterion, deleteCriterion } = useJudgingCriteria(themeId);

  // Add state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const remainingWeight = Math.max(0.05, 1 - criteria.reduce((sum, c) => sum + Number(c.weight), 0));
  const [newWeight, setNewWeight] = useState(Math.min(0.25, remainingWeight));
  const [newDescription, setNewDescription] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWeight, setEditWeight] = useState(0);

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const projectedTotal = totalWeight + newWeight;

  const startEditing = (criterion: JudgingCriterion) => {
    setEditingId(criterion.id);
    setEditName(criterion.name);
    setEditDescription(criterion.description ?? '');
    setEditWeight(Number(criterion.weight));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (criterion: JudgingCriterion) => {
    updateCriterion.mutate({
      id: criterion.id,
      name: editName,
      description: editDescription || null,
      weight: editWeight,
    }, {
      onSuccess: () => setEditingId(null),
    });
  };

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
        setNewWeight(Math.min(0.25, Math.max(0.05, 1 - (totalWeight + newWeight))));
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
        <Button size="sm" variant="outline" onClick={() => { setNewWeight(Math.min(0.25, remainingWeight)); setAdding(true); }} disabled={adding || totalWeight >= 0.995}>
          <Plus className="h-4 w-4 me-1" />
          {t('recognition.criteria.add')}
        </Button>
      </div>

      {criteria.map((criterion) => {
        const isEditing = editingId === criterion.id;
        // Weight available for this criterion = remaining + its own current weight
        const weightBudget = Math.max(0.05, 1 - (totalWeight - Number(criterion.weight)));
        const editProjectedTotal = totalWeight - Number(criterion.weight) + editWeight;

        return (
          <Card key={criterion.id} className="border">
            <CardContent className="pt-4 pb-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>{t('recognition.criteria.name')}</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('recognition.criteria.namePlaceholder')} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('recognition.criteria.description')}</Label>
                    <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('recognition.criteria.weight')}: {(editWeight * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[editWeight * 100]}
                      onValueChange={([v]) => setEditWeight(v / 100)}
                      min={5}
                      max={Math.round(weightBudget * 100)}
                      step={5}
                    />
                  </div>
                  {editProjectedTotal > 1.005 && (
                    <p className="text-xs text-destructive">{t('recognition.criteria.exceedsLimit')}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>{t('common.cancel')}</Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(criterion)}
                      disabled={!editName || updateCriterion.isPending || editProjectedTotal > 1.005}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
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
                    className="h-8 w-8"
                    onClick={() => startEditing(criterion)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteCriterion.mutate(criterion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

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
              <Slider value={[newWeight * 100]} onValueChange={([v]) => setNewWeight(v / 100)} min={5} max={Math.round(remainingWeight * 100)} step={5} />
            </div>
            {projectedTotal > 1.005 && (
              <p className="text-xs text-destructive">{t('recognition.criteria.exceedsLimit')}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleAdd} disabled={!newName || createCriterion.isPending || projectedTotal > 1.005}>{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


