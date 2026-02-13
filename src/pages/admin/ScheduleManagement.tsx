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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, Pause, Trash2, Users, Loader2 } from 'lucide-react';
import { useQuestionSchedules } from '@/hooks/useQuestionSchedules';
import { useProfile } from '@/hooks/useProfile';

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || undefined;
  const { schedules, isLoading, createSchedule, toggleStatus, deleteSchedule } = useQuestionSchedules(tenantId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<string>('1_per_day');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [questionsPerDelivery, setQuestionsPerDelivery] = useState(1);
  const [avoidWeekends, setAvoidWeekends] = useState(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('1_per_day');
    setPreferredTime('09:00');
    setQuestionsPerDelivery(1);
    setAvoidWeekends(true);
  };

  const handleCreate = () => {
    if (!name || !tenantId) return;
    createSchedule.mutate(
      {
        tenant_id: tenantId,
        name,
        description: description || undefined,
        frequency: frequency as any,
        preferred_time: preferredTime,
        questions_per_delivery: questionsPerDelivery,
        avoid_weekends: avoidWeekends,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('schedules.title')}</h1>
          <p className="text-muted-foreground">{t('schedules.subtitle')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
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
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
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
                  <TableHead>{t('schedules.targetAudience')}</TableHead>
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

      {/* Create Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('schedules.createSchedule')}</DialogTitle>
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
                  max={5}
                  value={questionsPerDelivery}
                  onChange={e => setQuestionsPerDelivery(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('schedules.avoidWeekends')}</Label>
              <Switch checked={avoidWeekends} onCheckedChange={setAvoidWeekends} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createSchedule.isPending || !name}>
              {createSchedule.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
