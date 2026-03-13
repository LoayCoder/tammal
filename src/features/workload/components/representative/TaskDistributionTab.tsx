import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Plus, Users, CheckCircle2, Clock, AlertTriangle, Download, Upload } from 'lucide-react';
import { DistributeTaskDialog } from '@/features/workload/components/representative/DistributeTaskDialog';
import { BatchDetailDialog } from '@/features/workload/components/representative/BatchDetailDialog';
import { BulkImportDialog } from '@/features/workload/components/representative/BulkImportDialog';
import { downloadTemplate } from '@/features/workload/components/representative/csvTemplate';
import { useState } from 'react';

interface TaskDistributionTabProps {
  tasks: any[];
  assignments: any[];
  distributeTask: any;
  isDistributing: boolean;
  bulkDistribute: any;
  isBulkDistributing: boolean;
}

export function TaskDistributionTab({ tasks, assignments, distributeTask, isDistributing, bulkDistribute, isBulkDistributing }: TaskDistributionTabProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{ id: string; title: string } | null>(null);

  const batches = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const batchId = task.source_id ?? 'unknown';
      if (!map.has(batchId)) map.set(batchId, []);
      map.get(batchId)!.push(task);
    }
    return Array.from(map.entries()).map(([batchId, batchTasks]) => ({
      batchId,
      title: batchTasks[0]?.title ?? '',
      due_date: batchTasks[0]?.due_date,
      total: batchTasks.length,
      done: batchTasks.filter((t: any) => t.status === 'completed').length,
      inProgress: batchTasks.filter((t: any) => t.status === 'in_progress').length,
      blocked: batchTasks.filter((t: any) => t.status === 'blocked').length,
    }));
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 me-2" />{t('representative.downloadTemplate')}</Button>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 me-2" />{t('representative.bulkImport')}</Button>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 me-2" />{t('representative.assignTask')}</Button>
      </div>

      {batches.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><p>{t('representative.noBatches')}</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map(batch => {
            const completion = batch.total > 0 ? Math.round((batch.done / batch.total) * 100) : 0;
            return (
              <Card key={batch.batchId} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedBatch({ id: batch.batchId, title: batch.title })}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{batch.title}</CardTitle>
                  {batch.due_date && <CardDescription className="text-xs">{t('representative.dueDate')}: {new Date(batch.due_date).toLocaleDateString()}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {batch.total}</span>
                    <span className="flex items-center gap-1 text-chart-1"><CheckCircle2 className="h-3 w-3" /> {batch.done}</span>
                    <span className="flex items-center gap-1 text-chart-4"><Clock className="h-3 w-3" /> {batch.inProgress}</span>
                    {batch.blocked > 0 && <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {batch.blocked}</span>}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${completion}%` }} /></div>
                  <p className="text-xs text-end text-muted-foreground">{completion}%</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DistributeTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} assignments={assignments} onSubmit={distributeTask} isSubmitting={isDistributing} />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} onSubmit={bulkDistribute} isSubmitting={isBulkDistributing} />
      <BatchDetailDialog open={!!selectedBatch} onOpenChange={(open) => { if (!open) setSelectedBatch(null); }} batchId={selectedBatch?.id ?? null} batchTitle={selectedBatch?.title ?? ''} />
    </div>
  );
}

