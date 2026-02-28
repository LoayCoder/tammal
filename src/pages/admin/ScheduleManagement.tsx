/**
 * ScheduleManagement — orchestrator page.
 * Structural refactor: useState → useReducer, audience logic → useAudienceResolver,
 * UI split into ScheduleForm, ScheduleAudienceSelector, ScheduleTimingConfig, SchedulePreviewSection.
 * ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar, CalendarClock, Pause, Trash2, Users, Loader2, Play, Pencil, Eye, Package, Building2, UserCheck } from 'lucide-react';
import SchedulePreviewDialog from '@/components/schedules/SchedulePreviewDialog';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import ScheduleAudienceSelector from '@/components/schedules/ScheduleAudienceSelector';
import ScheduleTimingConfig from '@/components/schedules/ScheduleTimingConfig';
import SchedulePreviewSection from '@/components/schedules/SchedulePreviewSection';
import { useQuestionSchedules, QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';
import { useQuestionBatches } from '@/hooks/questions/useQuestionBatches';
import { useProfile } from '@/hooks/auth/useProfile';
import { useGenerationPeriods } from '@/hooks/questions/useGenerationPeriods';
import { useMoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { useScheduleData } from '@/hooks/admin/useScheduleData';
import { useScheduleActions } from '@/hooks/admin/useScheduleActions';
import { useScheduleReducer } from '@/hooks/admin/useScheduleReducer';
import { resolveAudience, useAudienceResolver } from '@/hooks/admin/useAudienceResolver';
import { toast } from 'sonner';

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || undefined;
  const { schedules, isPending, createSchedule, updateSchedule, toggleStatus, deleteSchedule } = useQuestionSchedules(tenantId);
  const { batches } = useQuestionBatches(tenantId || null);
  const { periods } = useGenerationPeriods(tenantId || null);
  const { configs: moodConfigs, batchUpsertConfigs } = useMoodQuestionConfig(tenantId || null);
  const { activeMoods } = useMoodDefinitions(tenantId || null);

  const { availableDepartments, availableEmployees } = useScheduleData(tenantId);
  const {
    runningId, previewId, previewQuestions, previewLoading,
    handleRunNow, handlePreview, closePreview,
  } = useScheduleActions();

  const { state, dispatch, setField } = useScheduleReducer();

  const { dialogAudienceSummary, audienceViewResult, filteredAudienceList } = useAudienceResolver(
    availableEmployees,
    state.audienceType,
    state.selectedDepartments,
    state.selectedEmployees,
    state.audienceViewSchedule,
    state.audienceSearch,
  );

  const linkedPeriod = state.linkedPeriodId ? periods.find(p => p.id === state.linkedPeriodId) : null;

  // ── Handlers (unchanged logic) ────────────────────────────────────────────

  const buildTargetAudience = () => {
    if (state.audienceType === 'departments' && state.selectedDepartments.length > 0) {
      return { all: false, departments: state.selectedDepartments };
    }
    if (state.audienceType === 'specific' && state.selectedEmployees.length > 0) {
      return { all: false, specific_employees: state.selectedEmployees };
    }
    return { all: true };
  };

  const handleSubmit = () => {
    if (!state.name || !tenantId) return;
    if (state.scheduleType === 'survey' && (!state.startDate || !state.endDate || state.endDate < state.startDate)) {
      toast.error(t('schedules.dateRangeRequired'));
      return;
    }
    const target_audience = buildTargetAudience();
    const commonFields = {
      name: state.name,
      description: state.description || undefined,
      preferred_time: state.preferredTime,
      questions_per_delivery: state.scheduleType === 'survey' ? 0 : state.questionsPerDelivery,
      enable_ai_generation: false,
      batch_ids: state.selectedBatchIds,
      target_audience,
      schedule_type: state.scheduleType,
      start_date: state.scheduleType === 'survey' ? state.startDate : null,
      end_date: state.scheduleType === 'survey' ? state.endDate : null,
      frequency: state.scheduleType === 'daily_checkin' ? state.frequency as any : '1_per_day' as any,
      avoid_weekends: state.scheduleType === 'daily_checkin' ? state.weekendDays.length > 0 : false,
      weekend_days: state.scheduleType === 'daily_checkin' ? state.weekendDays : [],
      generation_period_id: state.linkedPeriodId || undefined,
    };

    const saveMoodConfigs = () => {
      if (state.scheduleType !== 'daily_checkin' || !tenantId) return;
      const configList = activeMoods.map(mood => {
        const override = state.moodOverrides[mood.key];
        const isOverridden = override?.enabled === true;
        const maxQ = isOverridden ? Math.min(override.value, state.questionsPerDelivery) : state.questionsPerDelivery;
        const existingCfg = moodConfigs.find(c => c.mood_level === mood.key);
        return {
          tenant_id: tenantId,
          mood_level: mood.key,
          is_enabled: existingCfg?.is_enabled ?? true,
          enable_free_text: existingCfg?.enable_free_text ?? (mood.key === 'great' || mood.key === 'need_help'),
          custom_prompt_context: existingCfg?.custom_prompt_context ?? null,
          max_questions: maxQ,
          is_custom_override: isOverridden,
        };
      });
      batchUpsertConfigs.mutate(configList);
    };

    if (state.editingSchedule) {
      updateSchedule.mutate(
        { id: state.editingSchedule.id, ...commonFields },
        { onSuccess: () => { saveMoodConfigs(); dispatch({ type: 'CLOSE_DIALOG' }); } },
      );
    } else {
      createSchedule.mutate(
        { tenant_id: tenantId, ...commonFields, status: 'active' },
        { onSuccess: () => { saveMoodConfigs(); dispatch({ type: 'CLOSE_DIALOG' }); } },
      );
    }
  };

  const handleDelete = () => {
    if (state.deleteId) {
      deleteSchedule.mutate(state.deleteId, { onSuccess: () => dispatch({ type: 'SET_DELETE_ID', id: null }) });
    }
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatus.mutate({ id, status: newStatus as 'active' | 'paused' });
  };

  // ── Render helpers ────────────────────────────────────────────────────────

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

  const renderAudienceCell = (schedule: QuestionSchedule) => {
    const result = resolveAudience(schedule.target_audience, availableEmployees);
    const countLabel = `(${result.includedCount}/${result.totalEligible})`;

    if (schedule.target_audience?.all || (!schedule.target_audience?.departments?.length && !schedule.target_audience?.specific_employees?.length)) {
      return (
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{t('schedules.allEmployees')}</span>
          <Badge variant="secondary" className="text-xs">{countLabel}</Badge>
        </div>
      );
    }
    if (schedule.target_audience?.departments?.length) {
      return (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          <span>{t('schedules.departmentsSelected', { count: schedule.target_audience.departments.length })}</span>
          <Badge variant="secondary" className="text-xs">{countLabel}</Badge>
        </div>
      );
    }
    if (schedule.target_audience?.specific_employees?.length) {
      return (
        <div className="flex items-center gap-1.5">
          <UserCheck className="h-4 w-4" />
          <span>{t('schedules.employeesSelected', { count: schedule.target_audience.specific_employees.length })}</span>
          <Badge variant="secondary" className="text-xs">{countLabel}</Badge>
        </div>
      );
    }
    return null;
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><CalendarClock className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('schedules.title')}</h1>
            <p className="text-muted-foreground">{t('schedules.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
          <Plus className="me-2 h-4 w-4" />
          {t('schedules.createSchedule')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.activeSchedules')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter(s => s.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.totalSchedules')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('schedules.pausedSchedules')}</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.filter(s => s.status === 'paused').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle>{t('schedules.allSchedules')}</CardTitle>
          <CardDescription>{t('schedules.manageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('schedules.noSchedules')}</p>
              <Button variant="outline" className="mt-4" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
                <Plus className="h-4 w-4 me-2" />
                {t('schedules.createFirst')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('schedules.name')}</TableHead>
                  <TableHead>{t('schedules.type')}</TableHead>
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
                    <TableCell>
                      <Badge variant={schedule.schedule_type === 'survey' ? 'default' : 'secondary'}>
                        {schedule.schedule_type === 'survey' ? t('schedules.survey') : t('schedules.dailyCheckin')}
                      </Badge>
                      {schedule.schedule_type === 'survey' && schedule.start_date && schedule.end_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {schedule.start_date} → {schedule.end_date}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{schedule.schedule_type === 'survey' ? '—' : getFrequencyLabel(schedule.frequency)}</TableCell>
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
                    <TableCell>{renderAudienceCell(schedule)}</TableCell>
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
                          title={t('schedules.viewAudience')}
                          onClick={() => dispatch({ type: 'SET_AUDIENCE_VIEW', schedule })}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.edit')}
                          onClick={() => dispatch({ type: 'OPEN_EDIT', schedule, moodConfigs })}
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
                          onClick={() => dispatch({ type: 'SET_DELETE_ID', id: schedule.id })}
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
      <Dialog open={state.dialogOpen} onOpenChange={(open) => { if (!open) dispatch({ type: 'CLOSE_DIALOG' }); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {state.editingSchedule ? t('schedules.editSchedule') : t('schedules.createSchedule')}
            </DialogTitle>
            <DialogDescription>
              {state.editingSchedule ? t('schedules.editScheduleDescription') : t('schedules.addScheduleDescription')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-10rem)]">
            <div className="space-y-4 py-4 pe-4">
              <ScheduleForm
                state={state}
                dispatch={dispatch}
                setField={setField}
                batches={batches}
                periods={periods}
              />
              <ScheduleTimingConfig
                state={state}
                dispatch={dispatch}
                setField={setField}
                activeMoods={activeMoods}
                linkedPeriod={linkedPeriod}
              />
              <ScheduleAudienceSelector
                state={state}
                setField={setField}
                availableDepartments={availableDepartments}
                availableEmployees={availableEmployees}
                dialogAudienceSummary={dialogAudienceSummary}
              />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch({ type: 'CLOSE_DIALOG' })}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSchedule.isPending || updateSchedule.isPending || !state.name || (state.scheduleType === 'survey' && (!state.startDate || !state.endDate || state.endDate < state.startDate))}
            >
              {(createSchedule.isPending || updateSchedule.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {state.editingSchedule ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!state.deleteId} onOpenChange={(open) => { if (!open) dispatch({ type: 'SET_DELETE_ID', id: null }); }}>
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
      <SchedulePreviewDialog
        open={!!previewId}
        onOpenChange={(open) => { if (!open) closePreview(); }}
        previewQuestions={previewQuestions}
        previewLoading={previewLoading}
      />

      {/* Audience Detail Viewer Dialog */}
      <SchedulePreviewSection
        audienceViewSchedule={state.audienceViewSchedule}
        onClose={() => dispatch({ type: 'SET_AUDIENCE_VIEW', schedule: null })}
        audienceViewResult={audienceViewResult}
        filteredAudienceList={filteredAudienceList}
        audienceSearch={state.audienceSearch}
        onSearchChange={(v) => setField('audienceSearch', v)}
      />
    </div>
  );
}
