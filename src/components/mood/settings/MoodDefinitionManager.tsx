import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Plus, Edit2, ChevronUp, ChevronDown, Trash2, Settings2 } from 'lucide-react';
import type { MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';

interface MoodDefinitionManagerProps {
  moods: MoodDefinition[];
  isLoading: boolean;
  isRTL: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onEdit: (mood: MoodDefinition) => void;
  onDelete: (mood: MoodDefinition) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function MoodDefinitionManager({
  moods, isLoading, isRTL, canDelete,
  onAdd, onEdit, onDelete, onToggle, onMoveUp, onMoveDown,
}: MoodDefinitionManagerProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{t('moodPathway.manageMoods')}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t('moodPathway.manageMoodsDesc')}
              </CardDescription>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            {t('moodPathway.addMood')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : moods.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('common.noData')}
          </p>
        ) : (
          <div className="space-y-2">
            {moods.map((mood, index) => {
              const label = isRTL ? mood.label_ar : mood.label_en;
              return (
                <div
                  key={mood.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    mood.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMoveUp(index)} disabled={index === 0}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onMoveDown(index)} disabled={index === moods.length - 1}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-2xl">{mood.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${mood.color}`}>{label}</span>
                      {mood.is_default && (
                        <Badge variant="outline" className="text-2xs h-4 px-1.5">
                          {t('moodPathway.defaultMoodBadge')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{mood.key} • {t('moodPathway.score')}: {mood.score}</span>
                  </div>
                  <Switch checked={mood.is_active} onCheckedChange={v => onToggle(mood.id, v)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(mood)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(mood)} disabled={!canDelete}
                    title={!canDelete ? t('moodPathway.minMoodsRequired') : undefined}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
