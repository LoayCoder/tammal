/**
 * ScheduleManagement — orchestrator page.
 * Structural refactor: useState → useReducer, audience logic → useAudienceResolver,
 * UI split into ScheduleForm, ScheduleAudienceSelector, ScheduleTimingConfig, SchedulePreviewSection.
 * ZERO behaviour change.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, TriangleAlert, Users } from 'lucide-react';
import { PageHeader } from '@/components/system';
import SchedulePreviewDialog from '@/components/schedules/SchedulePreviewDialog';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import ScheduleAudienceSelector from '@/components/schedules/ScheduleAudienceSelector';
import ScheduleTimingConfig from '@/components/schedules/ScheduleTimingConfig';
import SchedulePreviewSection from '@/components/schedules/SchedulePreviewSection';
import { ScheduleListTable } from '@/components/schedules/ScheduleListTable';
import { useQuestionSchedules } from '@/hooks/questions/useQuestionSchedules';
import { useQuestionBatches } from '@/hooks/questions/useQuestionBatches';
import { useProfile } from '@/hooks/auth/useProfile';
import { useGenerationPeriods } from '@/hooks/questions/useGenerationPeriods';
import { useMoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { useScheduleData } from '@/hooks/admin/useScheduleData';
import { useScheduleActions } from '@/hooks/admin/useScheduleActions';
import { useScheduleReducer } from '@/hooks/admin/useScheduleReducer';
import { useAudienceResolver } from '@/hooks/admin/useAudienceResolver';
import { toast } from 'sonner';

export default function ScheduleManagement() {
  const { t, i18n } = useTranslation();
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
    availableEmployees, state.audienceType, state.selectedDepartments, state.selectedEmployees,
    state.audienceViewSchedule, state.audienceSearch,
  );

  const linkedPeriod = state.linkedPeriodId ? periods.find(p => p.id === state.linkedPeriodId) : null;
  const [weekOffset, setWeekOffset] = useState(0);
  const isRTL = i18n.language === 'ar';
  const activeSchedules = schedules.filter((schedule) => schedule.status === 'active').length;
  const coverageRate = schedules.length > 0 ? Math.round((activeSchedules / schedules.length) * 100) : 0;
  const exceptionsCount = schedules.filter((schedule) => schedule.status === 'paused' || (schedule.schedule_type === 'survey' && !!schedule.end_date && new Date(schedule.end_date) < new Date())).length;
  const pendingApprovals = schedules.filter((schedule) => schedule.status === 'draft').length;
  const openTeamScopes = schedules.filter((schedule) => schedule.target_audience?.all || (schedule.target_audience?.departments?.length ?? 0) > 0).length;
  const dateWindow = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
    const formatter = new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { weekday: 'short', day: 'numeric' });
    const rangeFormatter = new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });

    return {
      label: `${rangeFormatter.format(days[0])} — ${rangeFormatter.format(days[6])}`,
      days: days.map((day) => ({
        key: day.toISOString(),
        label: formatter.format(day),
        isToday: day.toDateString() === new Date().toDateString(),
      })),
    };
  }, [isRTL, weekOffset]);

  const buildTargetAudience = () => {
    if (state.audienceType === 'departments' && state.selectedDepartments.length > 0)
      return { all: false, departments: state.selectedDepartments };
    if (state.audienceType === 'specific' && state.selectedEmployees.length > 0)
      return { all: false, specific_employees: state.selectedEmployees };
    return { all: true };
  };

  const handleSubmit = () => {
    const scheduleSchema = z.object({
      name: z.string().trim().min(1, t('schedules.nameRequired') || 'Schedule name is required'),
      tenantId: z.string().min(1, 'Tenant context is required'),
    }).superRefine((v, ctx) => {
      if (state.scheduleType === 'survey') {
        if (!state.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: t('schedules.dateRangeRequired') });
        if (!state.endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: t('schedules.dateRangeRequired') });
        if (state.startDate && state.endDate && state.endDate < state.startDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: t('schedules.dateRangeRequired') });
        }
      }
    });

    const parsed = scheduleSchema.safeParse({ name: state.name, tenantId: tenantId || '' });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Please fill in all required fields');
      return;
    }
    const target_audience = buildTargetAudience();
    const commonFields = {
      name: state.name, description: state.description || undefined,
      preferred_time: state.preferredTime,
      questions_per_delivery: state.scheduleType === 'survey' ? 0 : state.questionsPerDelivery,
      enable_ai_generation: false, batch_ids: state.selectedBatchIds, target_audience,
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
          tenant_id: tenantId, mood_level: mood.key,
          is_enabled: existingCfg?.is_enabled ?? true,
          enable_free_text: existingCfg?.enable_free_text ?? (mood.key === 'great' || mood.key === 'need_help'),
          custom_prompt_context: existingCfg?.custom_prompt_context ?? null,
          max_questions: maxQ, is_custom_override: isOverridden,
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
        { tenant_id: tenantId!, ...commonFields, status: 'active' },
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarClock className="h-5 w-5 text-primary" />}
        title={t('schedules.title')}
        subtitle={t('schedules.subtitle')}
        variant="card"
        actions={
          <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            <Plus className="me-2 h-4 w-4" />
            {t('schedules.createSchedule')}
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Operational overview</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Coverage, exceptions, and approval readiness</h2>
            </div>
            <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
              {openTeamScopes} team scopes live
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Coverage</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{coverageRate}%</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeSchedules} active schedules currently supporting workforce coverage.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Exceptions</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.14)] text-[#FBBF24]">
                  <TriangleAlert className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{exceptionsCount}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Paused or expired schedule windows needing operational review.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Pending approvals</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.14)] text-[#93C5FD]">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{pendingApprovals}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Draft schedules still awaiting completion or final operational approval.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Date navigation</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{dateWindow.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]" onClick={() => setWeekOffset((current) => current + (isRTL ? 1 : -1))}>
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]" onClick={() => setWeekOffset((current) => current + (isRTL ? -1 : 1))}>
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" dir={isRTL ? 'rtl' : 'ltr'}>
            {dateWindow.days.map((day) => (
              <div key={day.key} className={`rounded-2xl border p-3 text-center ${day.isToday ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]'}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">{day.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Adaptive week controls keep schedule review easy on mobile layouts and in RTL locales.</p>
        </div>
      </section>

      <ScheduleListTable
        schedules={schedules}
        isPending={isPending}
        availableEmployees={availableEmployees}
        runningId={runningId}
        onOpenCreate={() => dispatch({ type: 'OPEN_CREATE' })}
        onRunNow={handleRunNow}
        onPreview={handlePreview}
        onAudienceView={(schedule) => dispatch({ type: 'SET_AUDIENCE_VIEW', schedule })}
        onEdit={(schedule) => dispatch({ type: 'OPEN_EDIT', schedule, moodConfigs })}
        onToggle={handleToggle}
        onDelete={(id) => dispatch({ type: 'SET_DELETE_ID', id })}
      />

      {/* Create / Edit Schedule Dialog */}
      <Dialog open={state.dialogOpen} onOpenChange={(open) => { if (!open) dispatch({ type: 'CLOSE_DIALOG' }); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{state.editingSchedule ? t('schedules.editSchedule') : t('schedules.createSchedule')}</DialogTitle>
            <DialogDescription>{state.editingSchedule ? t('schedules.editScheduleDescription') : t('schedules.addScheduleDescription')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-10rem)]">
            <div className="space-y-4 py-4 pe-4">
              <ScheduleForm state={state} dispatch={dispatch} setField={setField} batches={batches} periods={periods} />
              <ScheduleTimingConfig state={state} dispatch={dispatch} setField={setField} activeMoods={activeMoods} linkedPeriod={linkedPeriod} />
              <ScheduleAudienceSelector state={state} setField={setField} availableDepartments={availableDepartments} availableEmployees={availableEmployees} dialogAudienceSummary={dialogAudienceSummary} />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch({ type: 'CLOSE_DIALOG' })}>{t('common.cancel')}</Button>
            <Button
              onClick={handleSubmit}
              disabled={createSchedule.isPending || updateSchedule.isPending || !state.name || (state.scheduleType === 'survey' && (!state.startDate || !state.endDate || state.endDate < state.startDate))}
            >
              {(createSchedule.isPending || updateSchedule.isPending) && <Loader2 className="h-4 w-4 animate-spin me-2" />}
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

      <SchedulePreviewDialog open={!!previewId} onOpenChange={(open) => { if (!open) closePreview(); }} previewQuestions={previewQuestions} previewLoading={previewLoading} />
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
