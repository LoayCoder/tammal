/**
 * ScheduleManagement — orchestrator page.
 * Structural refactor: useState → useReducer, audience logic → useAudienceResolver,
 * UI split into ScheduleForm, ScheduleAudienceSelector, ScheduleTimingConfig, SchedulePreviewSection.
 * ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Plus, CalendarClock, Loader2 } from 'lucide-react';
import SchedulePreviewDialog from '@/components/schedules/SchedulePreviewDialog';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import ScheduleAudienceSelector from '@/components/schedules/ScheduleAudienceSelector';
import ScheduleTimingConfig from '@/components/schedules/ScheduleTimingConfig';
import SchedulePreviewSection from '@/components/schedules/SchedulePreviewSection';
import { ScheduleStatCards } from '@/components/schedules/ScheduleStatCards';
import { ScheduleListTable } from '@/components/schedules/ScheduleListTable';
import { useQuestionSchedules } from '@/hooks/questions/useQuestionSchedules';
import { useQuestionBatches } from '@/hooks/questions/useQuestionBatches';
import { useProfile } from '@/features/auth/hooks/auth/useProfile';
import { useGenerationPeriods } from '@/hooks/questions/useGenerationPeriods';
import { useMoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { useScheduleData } from '@/features/admin/hooks/admin/useScheduleData';
import { useScheduleActions } from '@/features/admin/hooks/admin/useScheduleActions';
import { useScheduleReducer } from '@/features/admin/hooks/admin/useScheduleReducer';
import { useAudienceResolver } from '@/features/admin/hooks/admin/useAudienceResolver';
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
    availableEmployees, state.audienceType, state.selectedDepartments, state.selectedEmployees,
    state.audienceViewSchedule, state.audienceSearch,
  );

  const linkedPeriod = state.linkedPeriodId ? periods.find(p => p.id === state.linkedPeriodId) : null;

  const buildTargetAudience = () => {
    if (state.audienceType === 'departments' && state.selectedDepartments.length > 0)
      return { all: false, departments: state.selectedDepartments };
    if (state.audienceType === 'specific' && state.selectedEmployees.length > 0)
      return { all: false, specific_employees: state.selectedEmployees };
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

      <ScheduleStatCards schedules={schedules} />

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


