import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, Pause, Trash2, Users, Loader2, Play, Pencil, Eye, Package } from 'lucide-react';
import { useQuestionSchedules, QuestionSchedule } from '@/hooks/useQuestionSchedules';
import { useQuestionBatches } from '@/hooks/useQuestionBatches';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || undefined;
  const { schedules, isLoading, createSchedule, updateSchedule, toggleStatus, deleteSchedule } = useQuestionSchedules(tenantId);
  const { batches } = useQuestionBatches(tenantId || null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<QuestionSchedule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<string>('1_per_day');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [questionsPerDelivery, setQuestionsPerDelivery] = useState(1);
  const [weekendDays, setWeekendDays] = useState<number[]>([5, 6]);
  const [enableAI, setEnableAI] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('1_per_day');
    setPreferredTime('09:00');
    setQuestionsPerDelivery(1);
    setWeekendDays([5, 6]);
    setEnableAI(false);
    setSelectedBatchIds([]);
    setEditingSchedule(null);
  };

  const openEditDialog = (schedule: QuestionSchedule) => {
    setEditingSchedule(schedule);
    setName(schedule.name);
    setDescription(schedule.description || '');
    setFrequency(schedule.frequency);
    setPreferredTime(schedule.preferred_time || '09:00');
    setQuestionsPerDelivery(schedule.questions_per_delivery || 1);
    setWeekendDays((schedule as any).weekend_days || (schedule.avoid_weekends ? [5, 6] : []));
    setEnableAI(schedule.enable_ai_generation);
    setSelectedBatchIds(schedule.batch_ids || []);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !tenantId) return;

    if (editingSchedule) {
      updateSchedule.mutate(
        {
          id: editingSchedule.id,
          name,
          description: description || undefined,
          frequency: frequency as any,
          preferred_time: preferredTime,
          questions_per_delivery: questionsPerDelivery,
          avoid_weekends: weekendDays.length > 0,
          weekend_days: weekendDays,
          enable_ai_generation: enableAI,
          batch_ids: selectedBatchIds,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createSchedule.mutate(
        {
          tenant_id: tenantId,
          name,
          description: description || undefined,
          frequency: frequency as any,
          preferred_time: preferredTime,
          questions_per_delivery: questionsPerDelivery,
          avoid_weekends: weekendDays.length > 0,
          weekend_days: weekendDays,
          enable_ai_generation: enableAI,
          batch_ids: selectedBatchIds,
          target_audience: { all: true },
          status: 'active',
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        }
      );
    }
  };

  const handleRunNow = async (scheduleId: string) => {
    setRunningId(scheduleId);
    try {
      const { data, error } = await supabase.functions.invoke('schedule-engine', {
        body: { scheduleId, generateForDays: 7 },
      });
      if (error) throw error;
      toast.success(data?.message || t('schedules.runSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('schedules.runError'));
    } finally {
      setRunningId(null);
    }
  };

  const handlePreview = async (scheduleId: string) => {
    setPreviewId(scheduleId);
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_questions')
        .select(`
          id, status, scheduled_delivery, actual_delivery,
          question:questions(id, text, text_ar, type),
          employee:employees(id, full_name, email)
        `)
        .eq('schedule_id', scheduleId)
        .order('scheduled_delivery', { ascending: false })
        .limit(50);
      if (error) throw error;
      setPreviewQuestions(data || []);
    } catch {
      toast.error(t('common.error'));
      setPreviewQuestions([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSchedule.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{t('common.active')}</Badge>;
      case 'paused':
        return <Badge variant="secondary">{t('schedules.paused')}</Badge>;
      case 'draft':
        return <Badge variant="outline">{t('schedules.draft')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      '1_per_day': t('schedules.frequencies.daily'),
      '2_per_day': t('schedules.frequencies.twiceDaily'),
      '3_days_per_week': t('schedules.frequencies.threePerWeek'),
      'weekly': t('schedules.frequencies.weekly'),
      'custom': t('schedules.frequencies.custom'),
    };
    return labels[freq] || freq;
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatus.mutate({ id, status: newStatus as 'active' | 'paused' });
  };

  const getSqStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'outline',
      delivered: 'secondary',
      answered: 'default',
      skipped: 'destructive',
    };
    return <Badge variant={(map[status] || 'outline') as any}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('schedules.title')}</h1>
          <p className="text-muted-foreground">{t('schedules.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t('schedules.createSchedule')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.activeSchedules')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.totalSchedules')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.pausedSchedules')}</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.status === 'paused').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('schedules.allSchedules')}</CardTitle>
          <CardDescription>{t('schedules.manageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('schedules.noSchedules')}</p>
              <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 me-2" />
                {t('schedules.createFirst')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('schedules.name')}</TableHead>
                  <TableHead>{t('schedules.frequency')}</TableHead>
                  <TableHead>{t('schedules.questionBatches')}</TableHead>
                  <TableHead>{t('schedules.targetAudience')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('schedules.preferredTime')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{schedule.name}</span>
                        {schedule.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{schedule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getFrequencyLabel(schedule.frequency)}</TableCell>
                    <TableCell>
                      {(schedule.batch_ids?.length || 0) > 0 ? (
                        <Badge variant="secondary">
                          <Package className="h-3 w-3 me-1" />
                          {schedule.batch_ids.length} {schedule.batch_ids.length === 1 ? 'batch' : 'batches'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {schedule.target_audience?.all 
                          ? t('schedules.allEmployees')
                          : t('schedules.filtered')
                        }
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>{schedule.preferred_time || '09:00'}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('schedules.runNow')}
                          disabled={runningId === schedule.id || schedule.status !== 'active'}
                          onClick={() => handleRunNow(schedule.id)}
                        >
                          {runningId === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('schedules.viewScheduled')}
                          onClick={() => handlePreview(schedule.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.edit')}
                          onClick={() => openEditDialog(schedule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={schedule.status === 'active'}
                          onCheckedChange={() => handleToggle(schedule.id, schedule.status)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? t('schedules.editSchedule') : t('schedules.createSchedule')}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? t('schedules.editScheduleDescription') : t('schedules.addScheduleDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('schedules.name')}</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('schedules.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('schedules.description')}</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('schedules.descriptionPlaceholder')}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('schedules.frequency')}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_per_day">{t('schedules.frequencies.daily')}</SelectItem>
                  <SelectItem value="2_per_day">{t('schedules.frequencies.twiceDaily')}</SelectItem>
                  <SelectItem value="3_days_per_week">{t('schedules.frequencies.threePerWeek')}</SelectItem>
                  <SelectItem value="weekly">{t('schedules.frequencies.weekly')}</SelectItem>
                  <SelectItem value="custom">{t('schedules.frequencies.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('schedules.preferredTime')}</Label>
                <Input
                  type="time"
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('schedules.questionsPerDelivery')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={questionsPerDelivery}
                  onChange={e => setQuestionsPerDelivery(Number(e.target.value))}
                />
              </div>
            </div>
            {/* Question Batches Multi-Select */}
            <div className="space-y-2">
              <Label>{t('schedules.questionBatches')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <Package className="h-4 w-4 me-2" />
                    {selectedBatchIds.length > 0
                      ? t('schedules.batchesSelected', { count: selectedBatchIds.length })
                      : t('schedules.selectBatches')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-60 overflow-y-auto" align="start">
                  {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">{t('schedules.noBatchesAvailable')}</p>
                  ) : (
                    <div className="space-y-2">
                      {batches.map(batch => {
                        const isSelected = selectedBatchIds.includes(batch.id);
                        const isDisabled = !isSelected && selectedBatchIds.length >= 3;
                        return (
                          <label
                            key={batch.id}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBatchIds(prev => [...prev, batch.id]);
                                } else {
                                  setSelectedBatchIds(prev => prev.filter(id => id !== batch.id));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate block">{batch.name || 'Unnamed Batch'}</span>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {batch.question_count}
                            </Badge>
                          </label>
                        );
                      })}
                      {selectedBatchIds.length >= 3 && (
                        <p className="text-xs text-muted-foreground pt-1">{t('schedules.maxBatchesReached')}</p>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t('schedules.weekendDays')}</Label>
              <p className="text-xs text-muted-foreground">{t('schedules.weekendDaysHint')}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: t('schedules.days.sunday') },
                  { value: 1, label: t('schedules.days.monday') },
                  { value: 2, label: t('schedules.days.tuesday') },
                  { value: 3, label: t('schedules.days.wednesday') },
                  { value: 4, label: t('schedules.days.thursday') },
                  { value: 5, label: t('schedules.days.friday') },
                  { value: 6, label: t('schedules.days.saturday') },
                ].map(day => {
                  const isSelected = weekendDays.includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[70px]"
                      onClick={() => {
                        setWeekendDays(prev =>
                          isSelected
                            ? prev.filter(d => d !== day.value)
                            : [...prev, day.value]
                        );
                      }}
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('schedules.enableAI')}</Label>
              <Switch checked={enableAI} onCheckedChange={setEnableAI} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSchedule.isPending || updateSchedule.isPending || !name}
            >
              {(createSchedule.isPending || updateSchedule.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {editingSchedule ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('schedules.deleteSchedule')}</AlertDialogTitle>
            <AlertDialogDescription>{t('schedules.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Scheduled Questions Dialog */}
      <Dialog open={!!previewId} onOpenChange={(open) => { if (!open) { setPreviewId(null); setPreviewQuestions([]); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('schedules.viewScheduled')}</DialogTitle>
            <DialogDescription>
              {t('schedules.scheduledQuestionsDescription')}
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t('schedules.noScheduledQuestions')}</p>
              <p className="text-sm mt-1">{t('schedules.runToGenerate')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('schedules.employee')}</TableHead>
                  <TableHead>{t('schedules.question')}</TableHead>
                  <TableHead>{t('schedules.delivery')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewQuestions.map(sq => (
                  <TableRow key={sq.id}>
                    <TableCell className="text-sm">
                      {(sq.employee as any)?.full_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {(sq.question as any)?.text || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sq.scheduled_delivery
                        ? new Date(sq.scheduled_delivery).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>{getSqStatusBadge(sq.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
