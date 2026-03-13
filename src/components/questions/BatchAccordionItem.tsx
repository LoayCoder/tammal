import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import { Trash2, Calendar, User, Hash, ClipboardList, Heart, Send, Ban, CheckCircle, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { BatchQuestionTable } from './BatchQuestionTable';
import type { BatchQuestion } from '@/hooks/questions/useQuestionBatches';

interface BatchData {
  id: string;
  name: string | null;
  status: string;
  purpose: 'survey' | 'wellness';
  question_count: number;
  creator_name?: string | null;
  created_at?: string | null;
}

interface BatchAccordionItemProps {
  batch: BatchData;
  questions: BatchQuestion[] | undefined;
  filteredQuestions: BatchQuestion[];
  selectedIds: Set<string>;
  onToggleQuestion: (batchId: string, questionId: string) => void;
  onToggleAll: (batchId: string, questions: BatchQuestion[]) => void;
  onViewQuestion: (question: BatchQuestion) => void;
  onDeactivateSelected: (batchId: string, purpose: 'survey' | 'wellness') => void;
  onActivateSelected: (batchId: string, purpose: 'survey' | 'wellness') => void;
  onPublish: (batchId: string) => void;
  onActivateBatch: (batchId: string) => void;
  onDeactivateBatch: (batchId: string) => void;
  onDelete: (batchId: string) => void;
  onRename: (batchId: string, newName: string) => void;
  isPending: {
    deactivateQuestions: boolean;
    activateQuestions: boolean;
    publishBatch: boolean;
    activateBatch: boolean;
    deactivateBatch: boolean;
  };
  statusColor: (status: string) => string;
  statusLabel: (status: string) => string;
  typeLabel: (type: string) => string;
}

export function BatchAccordionItem({
  batch, questions, filteredQuestions, selectedIds,
  onToggleQuestion, onToggleAll, onViewQuestion,
  onDeactivateSelected, onActivateSelected,
  onPublish, onActivateBatch, onDeactivateBatch, onDelete, onRename,
  isPending, statusColor, statusLabel, typeLabel,
}: BatchAccordionItemProps) {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const selectedCount = selectedIds.size;

  const startEditing = () => {
    setEditingName(batch.name || '');
    setIsEditing(true);
  };

  const confirmRename = () => {
    onRename(batch.id, editingName);
    setIsEditing(false);
  };

  return (
    <AccordionItem value={batch.id} className="glass-card border-0 mb-3 px-1 group rounded-xl overflow-hidden">
      <AccordionTrigger className="hover:no-underline px-3">
        <div className="flex items-center gap-3 flex-1 text-start flex-wrap">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Input
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                className="h-7 text-sm w-48"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); confirmRename(); }}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setIsEditing(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <span className="font-semibold text-sm flex items-center gap-1.5">
              {batch.name || t('batches.unnamed')}
              <button
                className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                onClick={e => { e.stopPropagation(); startEditing(); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {batch.purpose === 'wellness' ? (
                <><Heart className="h-3 w-3 me-1" />{t('aiGenerator.purposeWellness', 'Daily Check-in')}</>
              ) : (
                <><ClipboardList className="h-3 w-3 me-1" />{t('aiGenerator.purposeSurvey', 'Survey')}</>
              )}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusColor(batch.status)}`}>
              {statusLabel(batch.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Hash className="h-3 w-3 me-1" />
              {t('batches.questionsCount', { count: batch.question_count })}
            </Badge>
            {batch.creator_name && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />{batch.creator_name}
              </span>
            )}
            {batch.created_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />{format(new Date(batch.created_at), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4">
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mb-2 flex-wrap">
          {selectedCount > 0 && (() => {
            const selectedQs = filteredQuestions.filter(q => selectedIds.has(q.id));
            const hasActive = selectedQs.some(q => q.validation_status !== 'inactive');
            const hasInactive = selectedQs.some(q => q.validation_status === 'inactive');
            return (
              <>
                {hasActive && (
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={e => { e.stopPropagation(); onDeactivateSelected(batch.id, batch.purpose); }}
                    disabled={isPending.deactivateQuestions}
                  >
                    <Ban className="h-4 w-4 me-1" />
                    {t('batches.deactivateSelected', { count: selectedCount })}
                  </Button>
                )}
                {hasInactive && (
                  <Button
                    variant="outline" size="sm"
                    onClick={e => { e.stopPropagation(); onActivateSelected(batch.id, batch.purpose); }}
                    disabled={isPending.activateQuestions}
                  >
                    <CheckCircle className="h-4 w-4 me-1" />
                    {t('batches.activateSelected', { count: selectedCount })}
                  </Button>
                )}
              </>
            );
          })()}
          {batch.status !== 'published' && batch.status !== 'inactive' && (
            <Button variant="default" size="sm" onClick={e => { e.stopPropagation(); onPublish(batch.id); }} disabled={isPending.publishBatch}>
              <Send className="h-4 w-4 me-1" />{t('batches.publish')}
            </Button>
          )}
          {batch.status === 'inactive' && (
            <Button variant="default" size="sm" onClick={e => { e.stopPropagation(); onActivateBatch(batch.id); }} disabled={isPending.activateBatch}>
              <CheckCircle className="h-4 w-4 me-1" />{t('batches.activate')}
            </Button>
          )}
          {batch.status !== 'inactive' && (
            <Button
              variant="outline" size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={e => { e.stopPropagation(); onDeactivateBatch(batch.id); }}
              disabled={isPending.deactivateBatch}
            >
              <Ban className="h-4 w-4 me-1" />{t('batches.deactivate')}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); onDelete(batch.id); }}>
            <Trash2 className="h-4 w-4 me-1" />{t('common.delete')}
          </Button>
        </div>

        {/* Questions table */}
        {!questions ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('batches.noQuestions')}</p>
        ) : (
          <BatchQuestionTable
            questions={filteredQuestions}
            batchId={batch.id}
            purpose={batch.purpose}
            selectedIds={selectedIds}
            onToggle={onToggleQuestion}
            onToggleAll={onToggleAll}
            onViewQuestion={onViewQuestion}
            statusColor={statusColor}
            statusLabel={statusLabel}
            typeLabel={typeLabel}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
