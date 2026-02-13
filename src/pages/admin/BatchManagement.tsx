import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuestionBatchManagement } from '@/hooks/useQuestionBatchManagement';
import { useProfile } from '@/hooks/useProfile';

import { Plus, Loader2, Trash2, CheckCircle, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function BatchManagement() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || null;
  const { batches, isLoading, createBatch, bulkPublish, createSchedules, softDelete } = useQuestionBatchManagement(tenantId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState('');
  const [questionCount, setQuestionCount] = useState(20);

  const handleCreate = () => {
    if (!targetMonth) return;
    createBatch.mutate(
      { targetMonth: `${targetMonth}-01`, questionCount },
      { onSuccess: () => setDialogOpen(false) }
    );
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

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={createBatch.isPending || !targetMonth}>
              {createBatch.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
