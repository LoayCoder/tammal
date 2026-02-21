import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuestionBatches, type BatchQuestion } from "@/hooks/useQuestionBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Package, Calendar, User, Hash, ClipboardList, Heart, Send, Ban, CheckCircle, Pencil, Check, X } from "lucide-react";

function ExpandableBatchText({ text, dir }: { text: string; dir?: string }) {
  if (!text || text === '—') return <span className="text-muted-foreground">—</span>;
  const isTruncated = text.length > 50;
  if (!isTruncated) return <p className="text-sm" dir={dir}>{text}</p>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className="text-sm line-clamp-2 cursor-help" dir={dir}>{text}</p>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm whitespace-pre-wrap">
        <p className="text-sm" dir={dir}>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
import { format } from "date-fns";

export default function QuestionManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, Set<string>>>({});

  // Get tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ['user-tenant-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc('get_user_tenant_id', { _user_id: user.id });
      return data as string | null;
    },
    enabled: !!user?.id,
  });

  const [viewQuestion, setViewQuestion] = useState<BatchQuestion | null>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const {
    batches, isLoading, fetchBatchQuestions, expandedBatchQuestions, deleteBatch, publishBatch, deactivateBatch, deactivateQuestions, activateBatch, activateQuestions, renameBatch, MAX_BATCH_SIZE,
  } = useQuestionBatches(tenantId || null);

  const handleAccordionChange = (values: string[]) => {
    const newlyExpanded = values.filter(v => !expandedBatches.includes(v));
    newlyExpanded.forEach(batchId => {
      if (!expandedBatchQuestions[batchId]) {
        fetchBatchQuestions(batchId);
      }
    });
    setExpandedBatches(values);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'validated':
      case 'published': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'inactive': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: t('batches.statusDraft'),
      published: t('batches.statusPublished'),
      validated: t('batches.statusValidated'),
      inactive: t('batches.statusInactive'),
      pending: t('batches.statusPending'),
    };
    return map[status] || status;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      likert_5: t('questions.types.likert_5'),
      numeric_scale: t('questions.types.numeric_scale'),
      yes_no: t('questions.types.yes_no'),
      open_ended: t('questions.types.open_ended'),
      multiple_choice: t('questions.types.multiple_choice'),
      // Legacy/AI-generated aliases
      scale: t('questions.types.numeric_scale'),
      likert: t('questions.types.likert_5'),
      mcq: t('questions.types.multiple_choice'),
      open_text: t('questions.types.open_ended'),
      open: t('questions.types.open_ended'),
      numeric: t('questions.types.numeric_scale'),
    };
    return map[type] || type;
  };

  const toggleQuestion = (batchId: string, questionId: string) => {
    setSelectedQuestions(prev => {
      const batchSet = new Set(prev[batchId] || []);
      if (batchSet.has(questionId)) {
        batchSet.delete(questionId);
      } else {
        batchSet.add(questionId);
      }
      return { ...prev, [batchId]: batchSet };
    });
  };

  const toggleAllQuestions = (batchId: string, questions: BatchQuestion[]) => {
    setSelectedQuestions(prev => {
      const batchSet = new Set(prev[batchId] || []);
      if (batchSet.size === questions.length && questions.length > 0) {
        return { ...prev, [batchId]: new Set() };
      }
      return { ...prev, [batchId]: new Set(questions.map(q => q.id)) };
    });
  };

  const handleDeactivateSelected = (batchId: string, purpose: 'survey' | 'wellness') => {
    const ids = Array.from(selectedQuestions[batchId] || []);
    if (ids.length === 0) return;
    deactivateQuestions.mutate({ batchId, questionIds: ids, purpose });
    setSelectedQuestions(prev => ({ ...prev, [batchId]: new Set() }));
  };

  const handleActivateSelected = (batchId: string, purpose: 'survey' | 'wellness') => {
    const ids = Array.from(selectedQuestions[batchId] || []);
    if (ids.length === 0) return;
    activateQuestions.mutate({ batchId, questionIds: ids, purpose });
    setSelectedQuestions(prev => ({ ...prev, [batchId]: new Set() }));
  };

  const filterBatchQuestions = (questions: BatchQuestion[]) => {
    if (!search) return questions;
    const s = search.toLowerCase();
    return questions.filter(q =>
      q.question_text.toLowerCase().includes(s) ||
      (q.question_text_ar && q.question_text_ar.includes(search))
    );
  };

  const filteredBatches = search
    ? batches.filter(b => {
        if (b.name?.toLowerCase().includes(search.toLowerCase())) return true;
        const batchQs = expandedBatchQuestions[b.id];
        if (batchQs) {
          return batchQs.some(q =>
            q.question_text.toLowerCase().includes(search.toLowerCase()) ||
            (q.question_text_ar && q.question_text_ar.includes(search))
          );
        }
        return true;
      })
    : batches;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('batches.title')}</h1>
        <p className="text-muted-foreground">{t('batches.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('batches.library')}</CardTitle>
              <CardDescription>{t('batches.libraryDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('batches.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{t('batches.noBatches')}</p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedBatches}
              onValueChange={handleAccordionChange}
            >
              {filteredBatches.map(batch => {
                const batchQuestions = expandedBatchQuestions[batch.id];
                const filtered = batchQuestions ? filterBatchQuestions(batchQuestions) : [];
                const selectedCount = selectedQuestions[batch.id]?.size || 0;

                return (
                  <AccordionItem key={batch.id} value={batch.id} className="border rounded-lg mb-3 px-1 group">
                    <AccordionTrigger className="hover:no-underline px-3">
                      <div className="flex items-center gap-3 flex-1 text-start flex-wrap">
                        {editingBatchId === batch.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Input
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              className="h-7 text-sm w-48"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  renameBatch.mutate({ batchId: batch.id, newName: editingName });
                                  setEditingBatchId(null);
                                }
                                if (e.key === 'Escape') setEditingBatchId(null);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={e => {
                                e.stopPropagation();
                                renameBatch.mutate({ batchId: batch.id, newName: editingName });
                                setEditingBatchId(null);
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={e => { e.stopPropagation(); setEditingBatchId(null); }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            {batch.name || t('batches.unnamed')}
                            <button
                              className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingBatchId(batch.id);
                                setEditingName(batch.name || '');
                              }}
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
                              <User className="h-3 w-3" />
                              {batch.creator_name}
                            </span>
                          )}
                          {batch.created_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(batch.created_at), 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <div className="flex justify-end gap-2 mb-2 flex-wrap">
                        {selectedCount > 0 && (() => {
                          const selectedIds = Array.from(selectedQuestions[batch.id] || []);
                          const selectedQs = filtered.filter(q => selectedIds.includes(q.id));
                          const hasActive = selectedQs.some(q => q.validation_status !== 'inactive');
                          const hasInactive = selectedQs.some(q => q.validation_status === 'inactive');
                          return (
                            <>
                              {hasActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeactivateSelected(batch.id, batch.purpose);
                                  }}
                                  disabled={deactivateQuestions.isPending}
                                >
                                  <Ban className="h-4 w-4 me-1" />
                                  {t('batches.deactivateSelected', { count: selectedCount })}
                                </Button>
                              )}
                              {hasInactive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivateSelected(batch.id, batch.purpose);
                                  }}
                                  disabled={activateQuestions.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 me-1" />
                                  {t('batches.activateSelected', { count: selectedCount })}
                                </Button>
                              )}
                            </>
                          );
                        })()}
                        {batch.status !== 'published' && batch.status !== 'inactive' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              publishBatch.mutate(batch.id);
                            }}
                            disabled={publishBatch.isPending}
                          >
                            <Send className="h-4 w-4 me-1" />
                            {t('batches.publish')}
                          </Button>
                        )}
                        {batch.status === 'inactive' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              activateBatch.mutate(batch.id);
                            }}
                            disabled={activateBatch.isPending}
                          >
                            <CheckCircle className="h-4 w-4 me-1" />
                            {t('batches.activate')}
                          </Button>
                        )}
                        {batch.status !== 'inactive' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              deactivateBatch.mutate(batch.id);
                            }}
                            disabled={deactivateBatch.isPending}
                          >
                            <Ban className="h-4 w-4 me-1" />
                            {t('batches.deactivate')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBatch.mutate(batch.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 me-1" />
                          {t('common.delete')}
                        </Button>
                      </div>

                      {!batchQuestions ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                      ) : filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('batches.noQuestions')}</p>
                      ) : (
                        <div className="rounded-md border overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10">
                                  <Checkbox
                                    checked={
                                      filtered.length > 0 &&
                                      selectedCount === filtered.length
                                    }
                                    onCheckedChange={() => toggleAllQuestions(batch.id, filtered)}
                                  />
                                </TableHead>
                                <TableHead className="w-8">#</TableHead>
                                <TableHead>{t('batches.questionText')}</TableHead>
                                <TableHead>{t('batches.questionTextAr')}</TableHead>
                                <TableHead className="w-24">{t('batches.type')}</TableHead>
                                {batch.purpose !== 'wellness' && (
                                  <TableHead className="w-24">{t('batches.confidence')}</TableHead>
                                )}
                                <TableHead className="w-24">{t('common.status')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((q, idx) => {
                                const isInactive = q.validation_status === 'inactive';
                                const isSelected = selectedQuestions[batch.id]?.has(q.id) || false;
                                return (
                                  <TableRow key={q.id} className={isInactive ? 'opacity-50' : ''}>
                                    <TableCell>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleQuestion(batch.id, q.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" onClick={() => setViewQuestion(q)}>
                                      <ExpandableBatchText text={q.question_text} />
                                    </TableCell>
                                    <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" onClick={() => setViewQuestion(q)}>
                                      <ExpandableBatchText text={q.question_text_ar || '—'} dir="rtl" />
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">{typeLabel(q.type)}</Badge>
                                    </TableCell>
                                    {batch.purpose !== 'wellness' && (
                                      <TableCell>
                                        {q.confidence_score != null ? `${q.confidence_score}%` : '—'}
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <Badge variant="outline" className={`text-xs ${statusColor(q.validation_status || 'pending')}`}>
                                        {statusLabel(q.validation_status || 'pending')}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewQuestion} onOpenChange={() => setViewQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('questions.questionDetails')}</DialogTitle>
            <DialogDescription>{t('questions.viewQuestion')}</DialogDescription>
          </DialogHeader>

          {viewQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('batches.questionText')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3">{viewQuestion.question_text}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('batches.questionTextAr')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3" dir="rtl">
                  {viewQuestion.question_text_ar || '—'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('batches.type')}:</span>
                  <Badge variant="outline">{typeLabel(viewQuestion.type)}</Badge>
                </div>
                {viewQuestion.confidence_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('batches.confidence')}:</span>
                    <Badge variant="outline">{viewQuestion.confidence_score}%</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('common.status')}:</span>
                  <Badge variant="outline" className={statusColor(viewQuestion.validation_status || 'pending')}>
                    {statusLabel(viewQuestion.validation_status || 'pending')}
                  </Badge>
                </div>
              </div>

              {viewQuestion.options && Array.isArray(viewQuestion.options) && viewQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t('questions.options')}</p>
                  <ol className="list-decimal list-inside space-y-1 bg-muted/50 rounded-md p-3">
                    {viewQuestion.options.map((opt: any, i: number) => (
                      <li key={i} className="text-sm">{typeof opt === 'string' ? opt : JSON.stringify(opt)}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewQuestion(null)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
