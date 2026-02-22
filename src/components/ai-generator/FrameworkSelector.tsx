import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, ChevronDown, Plus, Pencil, Trash2, Check, Search, CheckCheck, XCircle, FileText } from 'lucide-react';
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

function FrameworkDocCount({ frameworkId }: { frameworkId: string }) {
  const { documents } = useFrameworkDocuments(frameworkId);
  if (!documents || documents.length === 0) return null;
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
      <FileText className="h-2.5 w-2.5" />
      {documents.length}
    </Badge>
  );
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<ReferenceFramework | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isAr = i18n.language === 'ar';

  const toggleFramework = (id: string) => {
    onSelectedChange(
      selectedFrameworkIds.includes(id)
        ? selectedFrameworkIds.filter(f => f !== id)
        : [...selectedFrameworkIds, id]
    );
  };

  const selectAll = () => onSelectedChange(frameworks.map(f => f.id));
  const deselectAll = () => onSelectedChange([]);

  const { uploadDocument } = useFrameworkDocuments();

  const handleSave = async (data: any) => {
    const { files, ...frameworkData } = data;
    if (frameworkData.id) {
      onUpdate(frameworkData);
      if (files?.length) {
        for (const file of files) {
          uploadDocument({ frameworkId: frameworkData.id, file });
        }
      }
    } else {
      onAdd(frameworkData);
      if (files?.length) {
        setTimeout(async () => {
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

  const filteredFrameworks = searchQuery.trim()
    ? frameworks.filter(fw => {
        const q = searchQuery.toLowerCase();
        const name = (isAr && fw.name_ar ? fw.name_ar : fw.name).toLowerCase();
        return name.includes(q);
      })
    : frameworks;

  const showSearch = frameworks.length > 5;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
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
          {/* Header actions: Select All / Deselect All */}
          {frameworks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 gap-1"
                onClick={selectAll}
                disabled={selectedFrameworkIds.length === frameworks.length}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t('aiGenerator.selectAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 gap-1"
                onClick={deselectAll}
                disabled={selectedFrameworkIds.length === 0}
              >
                <XCircle className="h-3.5 w-3.5" />
                {t('aiGenerator.deselectAll')}
              </Button>
            </div>
          )}

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('aiGenerator.searchFrameworks')}
                className="h-8 text-xs ps-8"
              />
            </div>
          )}

          {/* Framework cards */}
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">{t('common.loading')}</p>
          ) : frameworks.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-primary/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t('aiGenerator.noFrameworksYet')}</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">{t('aiGenerator.noFrameworksDesc')}</p>
              </div>
              <Button
                size="sm"
                onClick={() => { setEditingFramework(null); setDialogOpen(true); }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {t('aiGenerator.addFramework')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFrameworks.map(fw => {
                const selected = selectedFrameworkIds.includes(fw.id);
                const isExpanded = expandedId === fw.id;
                const canEdit = !fw.is_default && (fw.created_by === currentUserId);
                const displayName = isAr && fw.name_ar ? fw.name_ar : fw.name;
                const displayDesc = isAr && fw.description_ar ? fw.description_ar : fw.description;

                return (
                  <div key={fw.id} className="group">
                    {/* Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleFramework(fw.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFramework(fw.id); } }}
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selected
                          ? 'bg-primary/5 border-primary/30 border-s-[3px] border-s-primary shadow-sm'
                          : 'bg-card border-border/50 hover:border-border hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon circle */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          selected ? 'bg-primary/15' : 'bg-primary/10'
                        }`}>
                          {fw.icon || '📋'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
                            {fw.is_default && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                                {t('aiGenerator.defaultArea')}
                              </Badge>
                            )}
                            {selected && (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 shrink-0 gap-0.5">
                                <Check className="h-2.5 w-2.5" />
                                {t('common.selected')}
                              </Badge>
                            )}
                            <FrameworkDocCount frameworkId={fw.id} />
                          </div>
                          {displayDesc && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{displayDesc}</p>
                          )}
                        </div>

                        {/* Action buttons - visible on hover */}
                        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => { setEditingFramework(fw); setDialogOpen(true); }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDelete(fw.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setExpandedId(isExpanded ? null : fw.id)}
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="ms-5 mt-1 p-3 rounded-lg bg-muted/30 border border-border/40 space-y-3 animate-in slide-in-from-top-1 duration-200">
                        {displayDesc && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{displayDesc}</p>
                        )}
                        <FrameworkDocuments frameworkId={fw.id} />
                        {canEdit && (
                          <div className="flex gap-1.5 pt-1 border-t border-border/30">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 gap-1"
                              onClick={() => { setEditingFramework(fw); setDialogOpen(true); }}
                            >
                              <Pencil className="h-3 w-3" />{t('common.edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => onDelete(fw.id)}
                            >
                              <Trash2 className="h-3 w-3" />{t('common.delete')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Framework button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-1 gap-1.5 border-dashed"
                onClick={() => { setEditingFramework(null); setDialogOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('aiGenerator.addFramework')}
              </Button>
            </div>
          )}
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
