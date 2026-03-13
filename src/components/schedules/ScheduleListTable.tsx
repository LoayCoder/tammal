import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { StatusBadge, SCHEDULE_STATUS_CONFIG } from '@/shared/status-badge';
import { Switch } from '@/shared/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Plus, Calendar, Pause, Trash2, Users, Loader2, Play, Pencil, Eye, Package, Building2, UserCheck } from 'lucide-react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';
import { resolveAudience } from '@/features/admin/hooks/admin/useAudienceResolver';

import type { AudienceEmployee } from '@/features/admin/hooks/admin/useAudienceResolver';

interface ScheduleListTableProps {
  schedules: QuestionSchedule[];
  isPending: boolean;
  availableEmployees: AudienceEmployee[];
  runningId: string | null;
  onOpenCreate: () => void;
  onRunNow: (id: string) => void;
  onPreview: (id: string) => void;
  onAudienceView: (schedule: QuestionSchedule) => void;
  onEdit: (schedule: QuestionSchedule) => void;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function ScheduleListTable({
  schedules, isPending, availableEmployees, runningId,
  onOpenCreate, onRunNow, onPreview, onAudienceView, onEdit, onToggle, onDelete,
}: ScheduleListTableProps) {
  const { t } = useTranslation();

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

  return (
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
            <Button variant="outline" className="mt-4" onClick={onOpenCreate}>
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
                  <TableCell>
                    <StatusBadge status={schedule.status} config={SCHEDULE_STATUS_CONFIG} translationPrefix="schedules" />
                  </TableCell>
                  <TableCell>{schedule.preferred_time || '09:00'}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title={t('schedules.runNow')} disabled={runningId === schedule.id || schedule.status !== 'active'} onClick={() => onRunNow(schedule.id)}>
                        {runningId === schedule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title={t('schedules.viewScheduled')} onClick={() => onPreview(schedule.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={t('schedules.viewAudience')} onClick={() => onAudienceView(schedule)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={t('common.edit')} onClick={() => onEdit(schedule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Switch checked={schedule.status === 'active'} onCheckedChange={() => onToggle(schedule.id, schedule.status)} />
                      <Button variant="ghost" size="icon" onClick={() => onDelete(schedule.id)}>
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
  );
}

