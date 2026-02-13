import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import { FocusArea } from '@/hooks/useFocusAreas';

interface FocusAreaManagerProps {
  focusAreas: FocusArea[];
  selectedAreas: string[];
  onToggleArea: (labelKey: string) => void;
  onAdd: (params: { labelKey: string; labelAr?: string }) => void;
  onUpdate: (params: { id: string; labelKey: string; labelAr?: string }) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function FocusAreaManager({
  focusAreas,
  selectedAreas,
  onToggleArea,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: FocusAreaManagerProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [manageOpen, setManageOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<FocusArea | null>(null);
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newLabelAr, setNewLabelAr] = useState('');
  const [addMode, setAddMode] = useState(false);

  const getLabel = (area: FocusArea) => {
    // Try translation key first for defaults
    const translationKey = `aiGenerator.areas.${area.label_key}`;
    const translated = t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
    // For custom areas, use label_key as English and label_ar for Arabic
    return isAr && area.label_ar ? area.label_ar : area.label_key;
  };

  const handleAdd = () => {
    if (!newLabelEn.trim()) return;
    onAdd({ labelKey: newLabelEn.trim(), labelAr: newLabelAr.trim() || undefined });
    setNewLabelEn('');
    setNewLabelAr('');
    setAddMode(false);
  };

  const handleUpdate = () => {
    if (!editingArea || !newLabelEn.trim()) return;
    onUpdate({ id: editingArea.id, labelKey: newLabelEn.trim(), labelAr: newLabelAr.trim() || undefined });
    setEditingArea(null);
    setNewLabelEn('');
    setNewLabelAr('');
  };

  const startEdit = (area: FocusArea) => {
    setEditingArea(area);
    setNewLabelEn(area.label_key);
    setNewLabelAr(area.label_ar || '');
    setAddMode(false);
  };

  const cancelEdit = () => {
    setEditingArea(null);
    setAddMode(false);
    setNewLabelEn('');
    setNewLabelAr('');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{t('aiGenerator.focusAreas')}</Label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('aiGenerator.focusAreas')}</Label>
        <Dialog open={manageOpen} onOpenChange={(open) => { setManageOpen(open); if (!open) cancelEdit(); }}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Settings2 className="h-3 w-3" />
              {t('aiGenerator.manageFocusAreas')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('aiGenerator.manageFocusAreas')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {focusAreas.map(area => (
                <div key={area.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30">
                  <span className="text-sm flex-1">{getLabel(area)}</span>
                  <div className="flex gap-1">
                    {!area.is_default && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(area)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDelete(area.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {area.is_default && (
                      <Badge variant="outline" className="text-[10px]">{t('aiGenerator.defaultArea')}</Badge>
                    )}
                  </div>
                </div>
              ))}

              {/* Add / Edit form */}
              {(addMode || editingArea) && (
                <div className="space-y-2 p-3 rounded-md border border-primary/30 bg-primary/5">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('aiGenerator.focusAreaLabelEn')}</Label>
                    <Input
                      value={newLabelEn}
                      onChange={e => setNewLabelEn(e.target.value)}
                      placeholder="e.g. Team Collaboration"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('aiGenerator.focusAreaLabelAr')}</Label>
                    <Input
                      value={newLabelAr}
                      onChange={e => setNewLabelAr(e.target.value)}
                      placeholder="مثال: التعاون الجماعي"
                      className="h-8 text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={editingArea ? handleUpdate : handleAdd}>
                      {editingArea ? t('common.save') : t('common.create')}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {!addMode && !editingArea && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => { setAddMode(true); setNewLabelEn(''); setNewLabelAr(''); }}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('aiGenerator.addFocusArea')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {focusAreas.map(area => (
          <Badge
            key={area.id}
            variant={selectedAreas.includes(area.label_key) ? 'default' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => onToggleArea(area.label_key)}
          >
            {getLabel(area)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
