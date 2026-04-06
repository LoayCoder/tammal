import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Bell, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Critical', dot: 'text-destructive' },
  { value: 2, label: 'High', dot: 'text-chart-5' },
  { value: 3, label: 'Normal', dot: 'text-chart-4' },
  { value: 4, label: 'Low', dot: 'text-muted-foreground/40' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '15', label: '15 min before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    priority: number;
    due_date: string | null;
    due_time: string | null;
    reminder_offset: number | null;
    description: string | null;
  }) => void;
}

export function TodoCreateDialog({ open, onOpenChange, onSubmit }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState('');
  const [reminderOffset, setReminderOffset] = useState('none');
  const [description, setDescription] = useState('');

  const reset = () => {
    setTitle('');
    setPriority(3);
    setDueDate(undefined);
    setDueTime('');
    setReminderOffset('none');
    setDescription('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      priority,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      due_time: dueTime || null,
      reminder_offset: reminderOffset && reminderOffset !== 'none' ? parseInt(reminderOffset) : null,
      description: description.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t('commandCenter.newTask', 'New Task')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('commandCenter.taskTitle', 'Task title...')}
            className="text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && title.trim()) handleSubmit(); }}
          />

          {/* Due Date + Time Row */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-start text-sm font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 me-2 shrink-0" />
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : t('commandCenter.dueDate', 'Due date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <div className="relative w-[130px]">
              <Clock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="ps-9 text-sm"
                placeholder="HH:MM"
              />
            </div>
          </div>

          {/* Priority + Reminder Row */}
          <div className="flex gap-2">
            <Select value={String(priority)} onValueChange={v => setPriority(Number(v))}>
              <SelectTrigger className="flex-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={String(p.value)} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Circle className={cn("h-2 w-2 fill-current", p.dot)} strokeWidth={0} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={reminderOffset} onValueChange={setReminderOffset}>
              <SelectTrigger className="flex-1 text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t('commandCenter.reminder', 'Reminder')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-sm">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('commandCenter.addNotes', 'Add notes (optional)...')}
            className="text-sm min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => { reset(); onOpenChange(false); }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
            {t('commandCenter.addTask', 'Add Task')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
