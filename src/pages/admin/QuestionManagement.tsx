import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import { useQuestionBatches, type BatchQuestion } from "@/hooks/questions/useQuestionBatches";
import { useTenantId } from "@/hooks/org/useTenantId";
import { Search, Package } from "lucide-react";
import { BatchStatusKPIs } from "@/components/questions/BatchStatusKPIs";
import { BatchAccordionItem } from "@/components/questions/BatchAccordionItem";
import { QuestionDetailDialog } from "@/components/questions/QuestionDetailDialog";

export default function QuestionManagement() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, Set<string>>>({});
  const [viewQuestion, setViewQuestion] = useState<BatchQuestion | null>(null);

  const {
    batches, isPending: isLoading, fetchBatchQuestions, expandedBatchQuestions,
    deleteBatch, publishBatch, deactivateBatch, deactivateQuestions,
    activateBatch, activateQuestions, renameBatch,
  } = useQuestionBatches(tenantId || null);

  const handleAccordionChange = (values: string[]) => {
    const newlyExpanded = values.filter(v => !expandedBatches.includes(v));
    newlyExpanded.forEach(batchId => {
      if (!expandedBatchQuestions[batchId]) fetchBatchQuestions(batchId);
    });
    setExpandedBatches(values);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'validated': case 'published': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'inactive': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: t('batches.statusDraft'), published: t('batches.statusPublished'),
      validated: t('batches.statusValidated'), inactive: t('batches.statusInactive'),
      pending: t('batches.statusPending'),
    };
    return map[status] || status;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      likert_5: t('questions.types.likert_5'), numeric_scale: t('questions.types.numeric_scale'),
      yes_no: t('questions.types.yes_no'), open_ended: t('questions.types.open_ended'),
      multiple_choice: t('questions.types.multiple_choice'),
      scale: t('questions.types.numeric_scale'), likert: t('questions.types.likert_5'),
      mcq: t('questions.types.multiple_choice'), open_text: t('questions.types.open_ended'),
      open: t('questions.types.open_ended'), numeric: t('questions.types.numeric_scale'),
    };
    return map[type] || type;
  };

  const toggleQuestion = (batchId: string, questionId: string) => {
    setSelectedQuestions(prev => {
      const batchSet = new Set(prev[batchId] || []);
      if (batchSet.has(questionId)) batchSet.delete(questionId);
      else batchSet.add(questionId);
      return { ...prev, [batchId]: batchSet };
    });
  };

  const toggleAllQuestions = (batchId: string, questions: BatchQuestion[]) => {
    setSelectedQuestions(prev => {
      const batchSet = new Set(prev[batchId] || []);
      if (batchSet.size === questions.length && questions.length > 0) return { ...prev, [batchId]: new Set() };
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
        if (batchQs) return batchQs.some(q => q.question_text.toLowerCase().includes(search.toLowerCase()) || (q.question_text_ar && q.question_text_ar.includes(search)));
        return true;
      })
    : batches;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('batches.title')}</h1>
        <p className="text-muted-foreground">{t('batches.subtitle')}</p>
      </div>

      <BatchStatusKPIs batches={batches} />

      <Card className="glass-card border-0">
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
            <Input placeholder={t('batches.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{t('batches.noBatches')}</p>
            </div>
          ) : (
            <Accordion type="multiple" value={expandedBatches} onValueChange={handleAccordionChange}>
              {filteredBatches.map(batch => {
                const batchQuestions = expandedBatchQuestions[batch.id];
                const filtered = batchQuestions ? filterBatchQuestions(batchQuestions) : [];
                return (
                  <BatchAccordionItem
                    key={batch.id}
                    batch={batch}
                    questions={batchQuestions}
                    filteredQuestions={filtered}
                    selectedIds={selectedQuestions[batch.id] || new Set()}
                    onToggleQuestion={toggleQuestion}
                    onToggleAll={toggleAllQuestions}
                    onViewQuestion={setViewQuestion}
                    onDeactivateSelected={handleDeactivateSelected}
                    onActivateSelected={handleActivateSelected}
                    onPublish={(id) => publishBatch.mutate(id)}
                    onActivateBatch={(id) => activateBatch.mutate(id)}
                    onDeactivateBatch={(id) => deactivateBatch.mutate(id)}
                    onDelete={(id) => deleteBatch.mutate(id)}
                    onRename={(id, name) => renameBatch.mutate({ batchId: id, newName: name })}
                    isPending={{
                      deactivateQuestions: deactivateQuestions.isPending,
                      activateQuestions: activateQuestions.isPending,
                      publishBatch: publishBatch.isPending,
                      activateBatch: activateBatch.isPending,
                      deactivateBatch: deactivateBatch.isPending,
                    }}
                    statusColor={statusColor}
                    statusLabel={statusLabel}
                    typeLabel={typeLabel}
                  />
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <QuestionDetailDialog
        question={viewQuestion}
        onClose={() => setViewQuestion(null)}
        statusColor={statusColor}
        statusLabel={statusLabel}
        typeLabel={typeLabel}
      />
    </div>
  );
}
