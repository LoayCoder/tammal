import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, ChevronDown, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { ReferenceFramework } from '@/hooks/useReferenceFrameworks';
import { FrameworkDialog } from './FrameworkDialog';
import { FrameworkDocuments } from './FrameworkDocuments';
import { useFrameworkDocuments } from '@/hooks/useFrameworkDocuments';

interface FrameworkSelectorProps {
  frameworks: ReferenceFramework[];
  selectedFrameworkIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onAdd: (data: { name: string; name_ar?: string; description?: string; description_ar?: string; icon?: string; framework_key: string }) => void;
  onUpdate: (data: { id: string; name: string; name_ar?: string; description?: string; description_ar?: string; icon?: string }) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  currentUserId?: string;
}

export function FrameworkSelector({
  frameworks,
  selectedFrameworkIds,
  onSelectedChange,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
  currentUserId,
}: FrameworkSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<ReferenceFramework | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isAr = i18n.language === 'ar';

  const toggleFramework = (id: string) => {
    onSelectedChange(
      selectedFrameworkIds.includes(id)
        ? selectedFrameworkIds.filter(f => f !== id)
        : [...selectedFrameworkIds, id]
    );
  };

  const { uploadDocument } = useFrameworkDocuments();

  const handleSave = async (data: any) => {
    const { files, ...frameworkData } = data;
    if (frameworkData.id) {
      onUpdate(frameworkData);
      // Upload files to existing framework
      if (files?.length) {
        for (const file of files) {
          uploadDocument({ frameworkId: frameworkData.id, file });
        }
      }
    } else {
      // For new frameworks, we call onAdd which returns the created id
      onAdd(frameworkData);
      // Files will be uploaded after the framework query invalidates
      // We need a different approach - store files and upload after mutation succeeds
      if (files?.length) {
        // Wait briefly for the mutation to complete and get the new framework
        setTimeout(async () => {
          // Refetch to find the new framework by key
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: newFw } = await supabase
            .from('reference_frameworks')
            .select('id')
            .eq('framework_key', frameworkData.framework_key)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (newFw?.id) {
            for (const file of files) {
              uploadDocument({ frameworkId: newFw.id, file });
            }
          }
        }, 1500);
      }
    }
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('aiGenerator.referenceFrameworks')}
            </CardTitle>
            {selectedFrameworkIds.length > 0 && (
              <Badge variant="default" className="text-xs">
                {t('aiGenerator.frameworksSelected', { count: selectedFrameworkIds.length })}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">{t('aiGenerator.referenceFrameworksDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
                <span className="flex items-center gap-1.5">
                  {t('aiGenerator.frameworks')}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1.5">
              {isLoading ? (
                <p className="text-xs text-muted-foreground py-2 text-center">{t('common.loading')}</p>
              ) : (
                frameworks.map(fw => {
                  const selected = selectedFrameworkIds.includes(fw.id);
                  const isExpanded = expandedId === fw.id;
                  const canEdit = !fw.is_default && (fw.created_by === currentUserId);
                  const displayName = isAr && fw.name_ar ? fw.name_ar : fw.name;
                  const displayDesc = isAr && fw.description_ar ? fw.description_ar : fw.description;

                  return (
                    <div key={fw.id}>
                      <button
                        type="button"
                        onClick={() => toggleFramework(fw.id)}
                        className={`flex items-center gap-2 p-2 rounded-md text-xs text-start transition-all cursor-pointer border w-full ${
                          selected
                            ? 'bg-primary/10 border-primary/30 border-s-2 border-s-primary'
                            : 'bg-muted/30 border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox checked={selected} className="pointer-events-none h-3.5 w-3.5" tabIndex={-1} />
                        <span>{fw.icon}</span>
                        <span className="text-foreground flex-1">{displayName}</span>
                        {fw.is_default && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">{t('aiGenerator.defaultArea')}</Badge>
                        )}
                        {selected && <Check className="h-3 w-3 text-primary shrink-0" />}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : fw.id); }}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </button>
                      {isExpanded && (
                        <div className="ms-8 mt-1 p-2 text-[11px] text-muted-foreground bg-muted/20 rounded border border-border/50">
                          {displayDesc && <p className="mb-2">{displayDesc}</p>}
                          <FrameworkDocuments frameworkId={fw.id} />
                          {canEdit && (
                            <div className="flex gap-1 mt-2">
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => { setEditingFramework(fw); setDialogOpen(true); }}>
                                <Pencil className="h-3 w-3 me-1" />{t('common.edit')}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-destructive" onClick={() => onDelete(fw.id)}>
                                <Trash2 className="h-3 w-3 me-1" />{t('common.delete')}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => { setEditingFramework(null); setDialogOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5 me-1" />
                {t('aiGenerator.addFramework')}
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <FrameworkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        framework={editingFramework}
        onSave={handleSave}
      />
    </>
  );
}
