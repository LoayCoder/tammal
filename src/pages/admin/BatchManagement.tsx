import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuestionBatchManagement } from '@/hooks/useQuestionBatchManagement';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

import { Plus, Loader2, Trash2, CheckCircle, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface WellnessQuestion {
  id: string;
  question_text_en: string;
  question_text_ar: string | null;
  question_type: string;
  status: string;
  options: string[];
}

export default function BatchManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || null;
  const { batches, isLoading, createBatch, bulkPublish, createSchedules, softDelete, fetchQuestions } = useQuestionBatchManagement(tenantId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [generating, setGenerating] = useState(false);

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<WellnessQuestion[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewBatchMonth, setReviewBatchMonth] = useState('');

  const handleCreate = async () => {
    if (!targetMonth || !tenantId) return;

    try {
      // 1. Create the batch record
      const batchResult = await createBatch.mutateAsync({
        targetMonth: `${targetMonth}-01`,
        questionCount,
      });

      const batchId = (batchResult as any)?.id;
      if (!batchId) {
        setDialogOpen(false);
        return;
      }

      // 2. Trigger AI generation
      setGenerating(true);
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-generate-wellness-pool', {
        body: { batchId, count: questionCount, tenantId },
        headers: session?.session?.access_token
          ? { Authorization: `Bearer ${session.session.access_token}` }
          : undefined,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('wellness.generateSuccess', { count: data?.count || questionCount }),
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      toast({
        title: t('common.error'),
        description: err?.message || t('wellness.generateError'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setDialogOpen(false);
    }
  };

  const handleReview = async (batchId: string, batchMonth: string) => {
    setReviewLoading(true);
    setReviewOpen(true);
    setReviewBatchMonth(batchMonth);
    try {
      const { data, error } = await fetchQuestions(batchId);
      if (error) throw error;
      setReviewQuestions((data || []) as unknown as WellnessQuestion[]);
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'reviewing': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('wellness.batchTitle')}</h1>
          <p className="text-muted-foreground">{t('wellness.batchDescription')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('wellness.generateBatch')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('wellness.targetMonth')}</TableHead>
                <TableHead>{t('wellness.questionCount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('wellness.createdAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : batches.map(batch => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    {format(new Date(batch.target_month), 'MMMM yyyy')}
                  </TableCell>
                  <TableCell>{batch.question_count}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(batch.status)}>{batch.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(batch.created_at), 'PP')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">{t('common.actions')}</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReview(batch.id, format(new Date(batch.target_month), 'MMMM yyyy'))}>
                          <Eye className="h-4 w-4 me-2" /> {t('wellness.reviewQuestions')}
                        </DropdownMenuItem>
                        {batch.status === 'draft' && (
                          <DropdownMenuItem onClick={() => bulkPublish.mutate(batch.id)}>
                            <CheckCircle className="h-4 w-4 me-2" /> {t('wellness.publish')}
                          </DropdownMenuItem>
                        )}
                        {batch.status === 'published' && (
                          <DropdownMenuItem onClick={() => createSchedules.mutate(batch.id)}>
                            <Calendar className="h-4 w-4 me-2" /> {t('wellness.schedule')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => softDelete.mutate(batch.id)}
                        >
                          <Trash2 className="h-4 w-4 me-2" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Generate dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!generating) setDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wellness.generateBatch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('wellness.targetMonth')}</Label>
              <Input type="month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} />
            </div>
            <div>
              <Label>{t('wellness.questionCount')}</Label>
              <Input
                type="number" min={1} max={100}
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
              />
            </div>
            {generating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('wellness.generating')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createBatch.isPending || generating || !targetMonth}>
              {(createBatch.isPending || generating) && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Questions dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('wellness.reviewQuestions')} — {reviewBatchMonth}</DialogTitle>
          </DialogHeader>
          {reviewLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reviewQuestions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t('wellness.noQuestions')}</p>
          ) : (
            <div className="space-y-3">
              {reviewQuestions.map((q, idx) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                      <Badge variant="outline">{q.question_type}</Badge>
                    </div>
                    <p className="font-medium mb-1">{q.question_text_en}</p>
                    {q.question_text_ar && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{q.question_text_ar}</p>
                    )}
                    {q.question_type === 'multiple_choice' && q.options?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{opt}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
