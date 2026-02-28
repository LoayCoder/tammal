import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { useAwardThemes, type CreateThemeInput } from '@/hooks/recognition/useAwardThemes';
import { CriteriaEditor } from './CriteriaEditor';

interface ThemeBuilderProps {
  cycleId: string;
}

export function ThemeBuilder({ cycleId }: ThemeBuilderProps) {
  const { t } = useTranslation();
  const { themes, isPending: isLoading, createTheme, deleteTheme } = useAwardThemes(cycleId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    createTheme.mutate({
      cycle_id: cycleId,
      name,
      name_ar: nameAr || undefined,
      description: description || undefined,
      sort_order: themes.length,
    }, {
      onSuccess: () => {
        setAdding(false);
        setName('');
        setNameAr('');
        setDescription('');
      },
    });
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('recognition.themes.title')}</h3>
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 me-1" />
          {t('recognition.themes.add')}
        </Button>
      </div>

      {themes.map((theme) => (
        <Collapsible key={theme.id} className="group/theme">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-start">
                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/theme:rotate-90 rtl:-scale-x-100" />
                  <CardTitle className="text-base">{theme.name}</CardTitle>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTheme.mutate(theme.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {theme.description && <p className="text-sm text-muted-foreground ms-6">{theme.description}</p>}
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-2">
                <CriteriaEditor themeId={theme.id} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {adding && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('recognition.themes.name')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('recognition.themes.nameAr')}</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('recognition.themes.description')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleAdd} disabled={!name || createTheme.isPending}>{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
