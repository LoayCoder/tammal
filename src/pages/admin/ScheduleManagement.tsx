import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, Pause, Trash2, Users, Loader2, Play, Pencil, Eye, Package, Building2, UserCheck, Search, Check, X, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import SchedulePreviewDialog from '@/components/schedules/SchedulePreviewDialog';
import { useQuestionSchedules, QuestionSchedule } from '@/hooks/useQuestionSchedules';
import { useQuestionBatches } from '@/hooks/useQuestionBatches';
import { useProfile } from '@/hooks/useProfile';
import { useGenerationPeriods } from '@/hooks/useGenerationPeriods';
import { useMoodQuestionConfig } from '@/hooks/useMoodQuestionConfig';
import { useMoodDefinitions } from '@/hooks/useMoodDefinitions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';

// --- Audience Resolution Utility ---
interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

interface AudienceResult {
  includedEmployees: Employee[];
  excludedEmployees: Employee[];
  totalEligible: number;
  includedCount: number;
}

function resolveAudience(
  targetAudience: QuestionSchedule['target_audience'],
  employees: Employee[]
): AudienceResult {
  const included: Employee[] = [];
  const excluded: Employee[] = [];

  for (const emp of employees) {
    let isIncluded = false;
    if (targetAudience?.all) {
      isIncluded = true;
    } else if (targetAudience?.departments?.length) {
      isIncluded = targetAudience.departments.includes(emp.department || '');
    } else if (targetAudience?.specific_employees?.length) {
      isIncluded = targetAudience.specific_employees.includes(emp.id);
    } else {
      // Default: all
      isIncluded = true;
    }
    if (isIncluded) included.push(emp);
    else excluded.push(emp);
  }

  return {
    includedEmployees: included,
    excludedEmployees: excluded,
    totalEligible: employees.length,
    includedCount: included.length,
  };
}

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || undefined;
  const { schedules, isLoading, createSchedule, updateSchedule, toggleStatus, deleteSchedule } = useQuestionSchedules(tenantId);
  const { batches } = useQuestionBatches(tenantId || null);
  const { periods } = useGenerationPeriods(tenantId || null);
  const { configs: moodConfigs, batchUpsertConfigs } = useMoodQuestionConfig(tenantId || null);
  const { activeMoods } = useMoodDefinitions(tenantId || null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<QuestionSchedule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audienceViewSchedule, setAudienceViewSchedule] = useState<QuestionSchedule | null>(null);
  const [audienceSearch, setAudienceSearch] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<string>('1_per_day');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [questionsPerDelivery, setQuestionsPerDelivery] = useState(1);
  const [weekendDays, setWeekendDays] = useState<number[]>([5, 6]);
  
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [audienceType, setAudienceType] = useState<'all' | 'departments' | 'specific'>('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily_checkin' | 'survey'>('daily_checkin');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [linkedPeriodId, setLinkedPeriodId] = useState<string | null>(null);
  const [moodOverrides, setMoodOverrides] = useState<Record<string, { enabled: boolean; value: number }>>({});
  const [moodConfigOpen, setMoodConfigOpen] = useState(false);

  // Resolve linked period
  const linkedPeriod = linkedPeriodId ? periods.find(p => p.id === linkedPeriodId) : null;

  // Fetch departments and employees for audience selection
  const { data: availableDepartments = [] } = useQuery({
    queryKey: ['schedule-departments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .not('department', 'is', null);
      if (error) throw error;
      return [...new Set(data.map(d => d.department).filter(Boolean))] as string[];
    },
    enabled: !!tenantId,
  });

  const { data: availableEmployees = [] } = useQuery({
    queryKey: ['schedule-employees', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, department')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  // --- Compute dialog audience summary in real-time ---
  const dialogAudienceSummary = useMemo(() => {
    const ta = audienceType === 'departments' && selectedDepartments.length > 0
      ? { all: false, departments: selectedDepartments }
      : audienceType === 'specific' && selectedEmployees.length > 0
        ? { all: false, specific_employees: selectedEmployees }
        : { all: true };
    return resolveAudience(ta as QuestionSchedule['target_audience'], availableEmployees);
  }, [audienceType, selectedDepartments, selectedEmployees, availableEmployees]);

  // --- Audience Detail Viewer computed data ---
  const audienceViewResult = useMemo(() => {
    if (!audienceViewSchedule) return null;
    return resolveAudience(audienceViewSchedule.target_audience, availableEmployees);
  }, [audienceViewSchedule, availableEmployees]);

  const filteredAudienceList = useMemo(() => {
    if (!audienceViewResult) return [];
    const all = [
      ...audienceViewResult.includedEmployees.map(e => ({ ...e, included: true })),
      ...audienceViewResult.excludedEmployees.map(e => ({ ...e, included: false })),
    ];
    if (!audienceSearch) return all;
    const q = audienceSearch.toLowerCase();
    return all.filter(
      e => e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
    );
  }, [audienceViewResult, audienceSearch]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('1_per_day');
    setPreferredTime('09:00');
    setQuestionsPerDelivery(1);
    setWeekendDays([5, 6]);
    
    setSelectedBatchIds([]);
    setEditingSchedule(null);
    setAudienceType('all');
    setSelectedDepartments([]);
    setSelectedEmployees([]);
    setEmployeeSearch('');
    setScheduleType('daily_checkin');
    setStartDate('');
    setEndDate('');
    setLinkedPeriodId(null);
    setMoodOverrides({});
    setMoodConfigOpen(false);
  };

  const openEditDialog = (schedule: QuestionSchedule) => {
    setEditingSchedule(schedule);
    setName(schedule.name);
    setDescription(schedule.description || '');
    setFrequency(schedule.frequency);
    setPreferredTime(schedule.preferred_time || '09:00');
    setQuestionsPerDelivery(schedule.questions_per_delivery || 1);
    setWeekendDays((schedule as any).weekend_days || (schedule.avoid_weekends ? [5, 6] : []));
    
    setSelectedBatchIds(schedule.batch_ids || []);
    const ta = schedule.target_audience;
    if (ta?.departments && ta.departments.length > 0) {
      setAudienceType('departments');
      setSelectedDepartments(ta.departments);
      setSelectedEmployees([]);
    } else if (ta?.specific_employees && ta.specific_employees.length > 0) {
      setAudienceType('specific');
      setSelectedEmployees(ta.specific_employees);
      setSelectedDepartments([]);
    } else {
      setAudienceType('all');
      setSelectedDepartments([]);
      setSelectedEmployees([]);
    }
    setEmployeeSearch('');
    setScheduleType(schedule.schedule_type || 'daily_checkin');
    setStartDate(schedule.start_date || '');
    setEndDate(schedule.end_date || '');
    setLinkedPeriodId(schedule.generation_period_id || null);
    // Load mood overrides from existing configs
    const overrides: Record<string, { enabled: boolean; value: number }> = {};
    for (const cfg of moodConfigs) {
      if ((cfg as any).is_custom_override) {
        overrides[cfg.mood_level] = { enabled: true, value: cfg.max_questions };
      }
    }
    setMoodOverrides(overrides);
    setMoodConfigOpen(Object.keys(overrides).length > 0);
    setDialogOpen(true);
  };

  const buildTargetAudience = () => {
    if (audienceType === 'departments' && selectedDepartments.length > 0) {
      return { all: false, departments: selectedDepartments };
    }
    if (audienceType === 'specific' && selectedEmployees.length > 0) {
      return { all: false, specific_employees: selectedEmployees };
    }
    return { all: true };
  };

  const handleSubmit = () => {
    if (!name || !tenantId) return;
    // Validate survey dates
    if (scheduleType === 'survey' && (!startDate || !endDate || endDate < startDate)) {
      toast.error(t('schedules.dateRangeRequired'));
      return;
    }
    const target_audience = buildTargetAudience();
    const commonFields = {
      name,
      description: description || undefined,
      preferred_time: preferredTime,
      questions_per_delivery: scheduleType === 'survey' ? 0 : questionsPerDelivery,
      enable_ai_generation: false,
      batch_ids: selectedBatchIds,
      target_audience,
      schedule_type: scheduleType,
      start_date: scheduleType === 'survey' ? startDate : null,
      end_date: scheduleType === 'survey' ? endDate : null,
      frequency: scheduleType === 'daily_checkin' ? frequency as any : '1_per_day' as any,
      avoid_weekends: scheduleType === 'daily_checkin' ? weekendDays.length > 0 : false,
      weekend_days: scheduleType === 'daily_checkin' ? weekendDays : [],
      generation_period_id: linkedPeriodId || undefined,
    };

    const saveMoodConfigs = () => {
      if (scheduleType !== 'daily_checkin' || !tenantId) return;
      const configList = activeMoods.map(mood => {
        const override = moodOverrides[mood.key];
        const isOverridden = override?.enabled === true;
        const maxQ = isOverridden ? Math.min(override.value, questionsPerDelivery) : questionsPerDelivery;
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

    if (editingSchedule) {
      updateSchedule.mutate(
        { id: editingSchedule.id, ...commonFields },
        { onSuccess: () => { saveMoodConfigs(); setDialogOpen(false); resetForm(); } }
      );
    } else {
      createSchedule.mutate(
        { tenant_id: tenantId, ...commonFields, status: 'active' },
        { onSuccess: () => { saveMoodConfigs(); setDialogOpen(false); resetForm(); } }
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
      // Fetch scheduled questions with employee info (no FK join for question since it's polymorphic)
      const { data: sqData, error: sqError } = await supabase
        .from('scheduled_questions')
        .select(`
          id, status, scheduled_delivery, actual_delivery, question_id, question_source,
          employee:employees(id, full_name, email, department, department_id, branch_id, section_id,
            branch:branches!employees_branch_id_fkey(id, name, name_ar),
            dept:departments!employees_department_id_fkey(id, name, name_ar),
            section:sites!employees_section_id_fkey(id, name, name_ar)
          )
        `)
        .eq('schedule_id', scheduleId)
        .order('scheduled_delivery', { ascending: false })
        .limit(500);
      if (sqError) throw sqError;

      const rows = sqData || [];
      
      // Group question IDs by source table
      const idsBySource: Record<string, string[]> = {};
      for (const row of rows) {
        const src = row.question_source || 'questions';
        if (!idsBySource[src]) idsBySource[src] = [];
        idsBySource[src].push(row.question_id);
      }

      // Fetch question texts from each source
      const questionMap: Record<string, { id: string; text: string; text_ar?: string | null; type?: string }> = {};

      const fetches: Promise<void>[] = [];

      if (idsBySource['questions']?.length) {
        fetches.push(
          Promise.resolve(supabase.from('questions').select('id, text, text_ar, type').in('id', idsBySource['questions']))
            .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = q; }); })
        );
      }
      if (idsBySource['wellness_questions']?.length) {
        fetches.push(
          Promise.resolve(supabase.from('wellness_questions').select('id, question_text_en, question_text_ar, question_type').in('id', idsBySource['wellness_questions']))
            .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = { id: q.id, text: q.question_text_en, text_ar: q.question_text_ar, type: q.question_type }; }); })
        );
      }
      if (idsBySource['generated_questions']?.length) {
        fetches.push(
          Promise.resolve(supabase.from('generated_questions').select('id, question_text, question_text_ar, type').in('id', idsBySource['generated_questions']))
            .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = { id: q.id, text: q.question_text, text_ar: q.question_text_ar, type: q.type }; }); })
        );
      }

      await Promise.all(fetches);

      // Merge question data into rows
      const merged = rows.map(row => ({
        ...row,
        question: questionMap[row.question_id] || null,
      }));

      setPreviewQuestions(merged);
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

  // --- Helper: Render audience cell with resolved counts ---
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
                          onClick={() => { setAudienceViewSchedule(schedule); setAudienceSearch(''); }}
                        >
                          <Users className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? t('schedules.editSchedule') : t('schedules.createSchedule')}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? t('schedules.editScheduleDescription') : t('schedules.addScheduleDescription')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <div className="space-y-4 py-4 pe-4">
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
            {/* Schedule Type Selector */}
            <div className="space-y-2">
              <Label>{t('schedules.scheduleType')}</Label>
              <RadioGroup
                value={scheduleType}
                onValueChange={(val) => {
                  setScheduleType(val as 'daily_checkin' | 'survey');
                  setSelectedBatchIds([]);
                  setLinkedPeriodId(null);
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="daily_checkin" id="type-checkin" />
                  <Label htmlFor="type-checkin" className="font-normal cursor-pointer">
                    {t('schedules.dailyCheckin')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="survey" id="type-survey" />
                  <Label htmlFor="type-survey" className="font-normal cursor-pointer">
                    {t('schedules.survey')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Link to Generation Period */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                {t('aiGenerator.generationPeriod')}
              </Label>
              <Select
                value={linkedPeriodId || '__none__'}
                onValueChange={(v) => {
                  if (v === '__none__') {
                    setLinkedPeriodId(null);
                  } else {
                    setLinkedPeriodId(v);
                    const period = periods.find(p => p.id === v);
                    if (period) {
                      setStartDate(period.start_date);
                      setEndDate(period.end_date);
                    }
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('common.none')}</SelectItem>
                  {periods.filter(p => p.status === 'active' && p.purpose === (scheduleType === 'daily_checkin' ? 'wellness' : 'survey')).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.start_date} → {p.end_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkedPeriod && (
                <Badge variant="secondary" className="text-xs">
                  {t('aiGenerator.periodLinked')}: {linkedPeriod.start_date} → {linkedPeriod.end_date}
                </Badge>
              )}
            </div>

            {/* Frequency - only for daily_checkin */}
            {scheduleType === 'daily_checkin' && (
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
            )}
            {/* Start/End Date/Time - only for survey */}
            {scheduleType === 'survey' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('schedules.startDate')}</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    readOnly={!!linkedPeriod}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('schedules.endDate')}</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                    readOnly={!!linkedPeriod}
                  />
                </div>
              </div>
            )}
            {/* Preferred Time - only for daily_checkin */}
            {scheduleType === 'daily_checkin' && (
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
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => {
                        const newVal = Math.max(1, questionsPerDelivery - 1);
                        setQuestionsPerDelivery(newVal);
                        setMoodOverrides(prev => {
                          const updated = { ...prev };
                          for (const key of Object.keys(updated)) {
                            if (updated[key].enabled && updated[key].value > newVal) {
                              updated[key] = { ...updated[key], value: newVal };
                            }
                          }
                          return updated;
                        });
                      }}
                      disabled={questionsPerDelivery <= 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">
                      {questionsPerDelivery}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuestionsPerDelivery(prev => Math.min(10, prev + 1))}
                      disabled={questionsPerDelivery >= 10}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Questions Per Mood Configuration - only for daily_checkin */}
            {scheduleType === 'daily_checkin' && activeMoods.length > 0 && (
              <Collapsible open={moodConfigOpen} onOpenChange={setMoodConfigOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      {t('schedules.questionsPerMood', 'Questions Per Mood')}
                    </span>
                    <div className="flex items-center gap-2">
                      {Object.values(moodOverrides).some(o => o.enabled) && (
                        <Badge variant="default" className="text-xs">
                          {Object.values(moodOverrides).filter(o => o.enabled).length} {t('schedules.customized', 'customized')}
                        </Badge>
                      )}
                      {moodConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border rounded-md p-3 mt-2 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t('schedules.moodInheritHint', 'Moods inherit the global Questions Per Delivery value unless overridden.')}
                    </p>
                    {activeMoods.map(mood => {
                      const override = moodOverrides[mood.key];
                      const isOverridden = override?.enabled === true;
                      const displayValue = isOverridden ? Math.min(override.value, questionsPerDelivery) : questionsPerDelivery;
                      return (
                        <div key={mood.key} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{mood.emoji}</span>
                            <span className="text-sm font-medium truncate">{mood.label_en}</span>
                            <Badge variant={isOverridden ? 'default' : 'secondary'} className="text-xs shrink-0">
                              {isOverridden ? t('schedules.customizedBadge', 'Customized') : t('schedules.defaultBadge', 'Default')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={isOverridden}
                              onCheckedChange={(checked) => {
                                setMoodOverrides(prev => ({
                                  ...prev,
                                  [mood.key]: { enabled: checked, value: prev[mood.key]?.value || questionsPerDelivery },
                                }));
                              }}
                            />
                            {isOverridden ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setMoodOverrides(prev => ({
                                      ...prev,
                                      [mood.key]: { ...prev[mood.key], value: Math.max(1, (prev[mood.key]?.value || 1) - 1) },
                                    }));
                                  }}
                                  disabled={displayValue <= 1}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">{displayValue}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setMoodOverrides(prev => ({
                                      ...prev,
                                      [mood.key]: { ...prev[mood.key], value: Math.min(questionsPerDelivery, (prev[mood.key]?.value || 1) + 1) },
                                    }));
                                  }}
                                  disabled={displayValue >= questionsPerDelivery}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="w-[76px] text-center text-sm text-muted-foreground tabular-nums">{displayValue}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
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
                  {(() => {
                    const filteredBatches = batches.filter(b => {
                      const matchesPurpose = scheduleType === 'daily_checkin' ? b.purpose === 'wellness' : b.purpose === 'survey';
                      return matchesPurpose && b.status === 'published';
                    });
                    return filteredBatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">{t('schedules.noBatchesAvailable')}</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredBatches.map(batch => {
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
                  );
                  })()}
                </PopoverContent>
              </Popover>
            </div>
            {/* Target Audience Section */}
            <div className="space-y-3">
              <Label>{t('schedules.audienceType')}</Label>
              <RadioGroup
                value={audienceType}
                onValueChange={(val) => setAudienceType(val as 'all' | 'departments' | 'specific')}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="audience-all" />
                  <Label htmlFor="audience-all" className="font-normal cursor-pointer flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {t('schedules.allEmployees')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="departments" id="audience-dept" />
                  <Label htmlFor="audience-dept" className="font-normal cursor-pointer flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {t('schedules.byDepartment')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="audience-specific" />
                  <Label htmlFor="audience-specific" className="font-normal cursor-pointer flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" />
                    {t('schedules.specificEmployees')}
                  </Label>
                </div>
              </RadioGroup>

              {audienceType === 'departments' && (
                <div className="border rounded-md p-3 space-y-2">
                  {availableDepartments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('schedules.noDepartmentsYet')}</p>
                  ) : (
                    <ScrollArea className="max-h-40">
                      <div className="space-y-2">
                        {availableDepartments.map(dept => (
                          <label key={dept} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                            <Checkbox
                              checked={selectedDepartments.includes(dept)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDepartments(prev => [...prev, dept]);
                                } else {
                                  setSelectedDepartments(prev => prev.filter(d => d !== dept));
                                }
                              }}
                            />
                            <span className="text-sm">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedDepartments.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('schedules.departmentsSelected', { count: selectedDepartments.length })}
                    </p>
                  )}
                </div>
              )}

              {audienceType === 'specific' && (
                <div className="border rounded-md p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('schedules.searchEmployees')}
                      value={employeeSearch}
                      onChange={e => setEmployeeSearch(e.target.value)}
                      className="ps-8 h-9"
                    />
                  </div>
                  {availableEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('schedules.noEmployeesYet')}</p>
                  ) : (
                    <ScrollArea className="max-h-40">
                      <div className="space-y-1">
                        {availableEmployees
                          .filter(emp =>
                            !employeeSearch ||
                            emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                            emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
                          )
                          .map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                              <Checkbox
                                checked={selectedEmployees.includes(emp.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEmployees(prev => [...prev, emp.id]);
                                  } else {
                                    setSelectedEmployees(prev => prev.filter(id => id !== emp.id));
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm block truncate">{emp.full_name}</span>
                                <span className="text-xs text-muted-foreground block truncate">{emp.email}</span>
                              </div>
                              {emp.department && (
                                <Badge variant="outline" className="text-xs shrink-0">{emp.department}</Badge>
                              )}
                            </label>
                          ))}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedEmployees.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('schedules.employeesSelected', { count: selectedEmployees.length })}
                    </p>
                  )}
                </div>
              )}

              {/* Live Audience Summary Card */}
              <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('schedules.audienceSummary')}</span>
                  <Badge variant="secondary" className="text-xs">
                    {t('schedules.includedCount', {
                      included: dialogAudienceSummary.includedCount,
                      total: dialogAudienceSummary.totalEligible,
                    })}
                  </Badge>
                </div>
                {dialogAudienceSummary.totalEligible > 0 && (
                  <Progress
                    value={(dialogAudienceSummary.includedCount / dialogAudienceSummary.totalEligible) * 100}
                    className="h-2"
                  />
                )}
                {dialogAudienceSummary.includedCount === dialogAudienceSummary.totalEligible && dialogAudienceSummary.totalEligible > 0 && (
                  <p className="text-xs text-muted-foreground">{t('schedules.allIncluded')}</p>
                )}
              </div>
            </div>
            {scheduleType === 'daily_checkin' && (
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
            )}


          </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSchedule.isPending || updateSchedule.isPending || !name || (scheduleType === 'survey' && (!startDate || !endDate || endDate < startDate))}
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
      <SchedulePreviewDialog
        open={!!previewId}
        onOpenChange={(open) => { if (!open) { setPreviewId(null); setPreviewQuestions([]); } }}
        previewQuestions={previewQuestions}
        previewLoading={previewLoading}
      />

      {/* Audience Detail Viewer Dialog */}
      <Dialog open={!!audienceViewSchedule} onOpenChange={(open) => { if (!open) setAudienceViewSchedule(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('schedules.audienceDetails')}</DialogTitle>
            <DialogDescription>
              {audienceViewSchedule?.name}
            </DialogDescription>
          </DialogHeader>
          {audienceViewResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <span className="text-sm font-medium">{t('schedules.audienceSummary')}</span>
                <Badge variant="secondary">
                  {t('schedules.includedCount', {
                    included: audienceViewResult.includedCount,
                    total: audienceViewResult.totalEligible,
                  })}
                </Badge>
              </div>
              {audienceViewResult.totalEligible > 0 && (
                <Progress
                  value={(audienceViewResult.includedCount / audienceViewResult.totalEligible) * 100}
                  className="h-2"
                />
              )}
              {audienceViewResult.includedCount === audienceViewResult.totalEligible && audienceViewResult.totalEligible > 0 && (
                <p className="text-sm text-muted-foreground">{t('schedules.allIncluded')}</p>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('schedules.searchAudience')}
                  value={audienceSearch}
                  onChange={e => setAudienceSearch(e.target.value)}
                  className="ps-8"
                />
              </div>

              {/* Employee List */}
              <ScrollArea className="max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employees.name')}</TableHead>
                      <TableHead>{t('employees.email')}</TableHead>
                      <TableHead>{t('employees.department')}</TableHead>
                      <TableHead className="text-end">{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudienceList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          {t('common.noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAudienceList.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell className="text-sm font-medium">{emp.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                          <TableCell className="text-sm">{emp.department || '—'}</TableCell>
                          <TableCell className="text-end">
                            {emp.included ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                {t('schedules.included')}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <X className="h-3 w-3" />
                                {t('schedules.notIncluded')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
