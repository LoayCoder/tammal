import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionBatches, type BatchQuestion } from "@/hooks/useQuestionBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, ChevronDown, Package, Calendar, User, Hash, ClipboardList, Heart } from "lucide-react";
import { format } from "date-fns";

export default function QuestionManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

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
    batches, isLoading, fetchBatchQuestions, expandedBatchQuestions, deleteBatch, MAX_BATCH_SIZE,
  } = useQuestionBatches(tenantId || null);

  const handleAccordionChange = (values: string[]) => {
    // Fetch questions for newly expanded batches
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
      case 'validated': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
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
        // Keep batch if name matches or if we need to check questions
        if (b.name?.toLowerCase().includes(search.toLowerCase())) return true;
        const batchQs = expandedBatchQuestions[b.id];
        if (batchQs) {
          return batchQs.some(q =>
            q.question_text.toLowerCase().includes(search.toLowerCase()) ||
            (q.question_text_ar && q.question_text_ar.includes(search))
          );
        }
        return true; // Include if questions not loaded yet
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
              {filteredBatches.map(batch => (
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
                    <div className="flex justify-end mb-2">
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

                    {!expandedBatchQuestions[batch.id] ? (
                      <div className="space-y-2">
                        {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : filterBatchQuestions(expandedBatchQuestions[batch.id]).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('batches.noQuestions')}</p>
                    ) : (
                      <div className="rounded-md border overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8">#</TableHead>
                              <TableHead>{t('batches.questionText')}</TableHead>
                              <TableHead>{t('batches.questionTextAr')}</TableHead>
                              <TableHead className="w-24">{t('batches.type')}</TableHead>
                              <TableHead className="w-24">{t('batches.confidence')}</TableHead>
                              <TableHead className="w-24">{t('common.status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterBatchQuestions(expandedBatchQuestions[batch.id]).map((q, idx) => (
                              <TableRow key={q.id}>
                                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="max-w-xs truncate">{q.question_text}</TableCell>
                                <TableCell className="max-w-xs truncate" dir="rtl">{q.question_text_ar || '—'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                </TableCell>
                                <TableCell>
                                  {q.confidence_score != null ? `${q.confidence_score}%` : '—'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs ${statusColor(q.validation_status || 'pending')}`}>
                                    {q.validation_status || 'pending'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
