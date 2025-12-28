import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Play, Pause, Trash2, Users } from 'lucide-react';
import { useQuestionSchedules } from '@/hooks/useQuestionSchedules';
import { format } from 'date-fns';

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { schedules, isLoading, toggleStatus, deleteSchedule } = useQuestionSchedules();

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

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      '1_per_day': t('schedules.frequencies.daily'),
      '2_per_day': t('schedules.frequencies.twiceDaily'),
      '3_days_per_week': t('schedules.frequencies.threePerWeek'),
      'weekly': t('schedules.frequencies.weekly'),
      'custom': t('schedules.frequencies.custom'),
    };
    return labels[frequency] || frequency;
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatus.mutate({ id, status: newStatus as 'active' | 'paused' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('schedules.title')}</h1>
          <p className="text-muted-foreground">{t('schedules.subtitle')}</p>
        </div>
        <Button>
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
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('schedules.noSchedules')}</p>
              <Button variant="outline" className="mt-4">
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
                  <TableHead>{t('schedules.audience')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('schedules.preferredTime')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>{getFrequencyLabel(schedule.frequency)}</TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={schedule.status === 'active'}
                          onCheckedChange={() => handleToggle(schedule.id, schedule.status)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule.mutate(schedule.id)}
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
    </div>
  );
}