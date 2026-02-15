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
import { useQuestionBatches, type BatchQuestion } from "@/hooks/useQuestionBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Package, Calendar, User, Hash, ClipboardList, Heart, Send, Ban } from "lucide-react";
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

  const {
    batches, isLoading, fetchBatchQuestions, expandedBatchQuestions, deleteBatch, publishBatch, deactivateBatch, deactivateQuestions, MAX_BATCH_SIZE,
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
      const activeQuestions = questions.filter(q => q.validation_status !== 'inactive');
      if (batchSet.size === activeQuestions.length && activeQuestions.length > 0) {
        return { ...prev, [batchId]: new Set() };
      }
      return { ...prev, [batchId]: new Set(activeQuestions.map(q => q.id)) };
    });
  };

  const handleDeactivateSelected = (batchId: string, purpose: 'survey' | 'wellness') => {
    const ids = Array.from(selectedQuestions[batchId] || []);
    if (ids.length === 0) return;
    deactivateQuestions.mutate({ batchId, questionIds: ids, purpose });
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
                  <AccordionItem key={batch.id} value={batch.id} className="border rounded-lg mb-3 px-1">
                    <AccordionTrigger className="hover:no-underline px-3">
                      <div className="flex items-center gap-3 flex-1 text-start flex-wrap">
                        <span className="font-semibold text-sm">
                          {batch.name || t('batches.unnamed')}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {batch.purpose === 'wellness' ? (
                              <><Heart className="h-3 w-3 me-1" />{t('aiGenerator.purposeWellness', 'Daily Check-in')}</>
                            ) : (
                              <><ClipboardList className="h-3 w-3 me-1" />{t('aiGenerator.purposeSurvey', 'Survey')}</>
                            )}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${statusColor(batch.status)}`}>
                            {batch.status}
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
                        {selectedCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
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
                            {t('batches.publish', 'Publish')}
                          </Button>
                        )}
                        {batch.status !== 'inactive' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                            onClick={(e) => {
                              e.stopPropagation();
                              deactivateBatch.mutate(batch.id);
                            }}
                            disabled={deactivateBatch.isPending}
                          >
                            <Ban className="h-4 w-4 me-1" />
                            {t('batches.deactivate', 'Deactivate')}
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
                                      filtered.filter(q => q.validation_status !== 'inactive').length > 0 &&
                                      selectedCount === filtered.filter(q => q.validation_status !== 'inactive').length
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
                                        disabled={isInactive}
                                        onCheckedChange={() => toggleQuestion(batch.id, q.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell className="max-w-xs truncate">{q.question_text}</TableCell>
                                    <TableCell className="max-w-xs truncate" dir="rtl">{q.question_text_ar || '—'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                    </TableCell>
                                    {batch.purpose !== 'wellness' && (
                                      <TableCell>
                                        {q.confidence_score != null ? `${q.confidence_score}%` : '—'}
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <Badge variant="outline" className={`text-xs ${statusColor(q.validation_status || 'pending')}`}>
                                        {q.validation_status || 'pending'}
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
    </div>
  );
}
