import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Bell, Circle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { PersonalTodo } from '../hooks/usePersonalTodos';

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
  todo: PersonalTodo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: {
    id: string;
    title?: string;
    priority?: number;
    due_date?: string | null;
    due_time?: string | null;
    reminder_offset?: number | null;
    description?: string | null;
  }) => void;
  onDelete: (id: string) => void;
}

export function TodoEditSheet({ todo, open, onOpenChange, onUpdate, onDelete }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState('');
  const [reminderOffset, setReminderOffset] = useState('none');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setPriority(todo.priority);
      setDueDate(todo.due_date ? new Date(todo.due_date + 'T00:00') : undefined);
      setDueTime(todo.due_time ? todo.due_time.substring(0, 5) : '');
      setReminderOffset(todo.reminder_offset != null ? String(todo.reminder_offset) : 'none');
      setDescription(todo.description ?? '');
    }
  }, [todo]);

  const handleSave = () => {
    if (!todo || !title.trim()) return;
    onUpdate({
      id: todo.id,
      title: title.trim(),
      priority,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      due_time: dueTime || null,
      reminder_offset: reminderOffset && reminderOffset !== 'none' ? parseInt(reminderOffset) : null,
      description: description.trim() || null,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!todo) return;
    onDelete(todo.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-base">{t('commandCenter.editTask', 'Edit Task')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('commandCenter.taskTitle', 'Task title...')}
            className="text-sm"
          />

          {/* Due Date + Time */}
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
              />
            </div>
          </div>

          {/* Priority + Reminder */}
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

        <SheetFooter className="flex-row justify-between gap-2">
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete', 'Delete')}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
              {t('common.save', 'Save')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
