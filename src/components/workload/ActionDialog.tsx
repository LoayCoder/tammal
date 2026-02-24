import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ObjAction } from '@/hooks/workload/useActions';

const schema = z.object({
  title: z.string().min(1).max(200),
  title_ar: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  priority: z.coerce.number().int().min(1).max(5),
  estimated_hours: z.coerce.number().min(0.5).max(1000),
  status: z.enum(['planned', 'scheduled', 'in_progress', 'completed', 'blocked']),
  work_hours_only: z.boolean(),
  planned_start: z.string().optional().or(z.literal('')),
  planned_end: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: ObjAction | null;
  initiativeId: string;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function ActionDialog({ open, onOpenChange, action, initiativeId, onSubmit, isSubmitting }: Props) {
  const { t } = useTranslation();
  const isEditing = !!action;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', title_ar: '', description: '', priority: 3,
      estimated_hours: 1, status: 'planned', work_hours_only: true,
      planned_start: '', planned_end: '',
    },
  });

  useEffect(() => {
    if (action) {
      form.reset({
        title: action.title, title_ar: action.title_ar || '',
        description: action.description || '', priority: action.priority,
        estimated_hours: Number(action.estimated_hours), status: action.status as any,
        work_hours_only: action.work_hours_only,
        planned_start: action.planned_start || '', planned_end: action.planned_end || '',
      });
    } else {
      form.reset({
        title: '', title_ar: '', description: '', priority: 3,
        estimated_hours: 1, status: 'planned', work_hours_only: true,
        planned_start: '', planned_end: '',
      });
    }
  }, [action, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      initiative_id: initiativeId,
      title_ar: data.title_ar || null,
      description: data.description || null,
      planned_start: data.planned_start || null,
      planned_end: data.planned_end || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('workload.actions.edit') : t('workload.actions.add')}</DialogTitle>
          <DialogDescription>{isEditing ? t('workload.actions.editDesc') : t('workload.actions.addDesc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.actions.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="title_ar" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.actions.titleAr')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.actions.description')}</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.actions.priority')}</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {[1,2,3,4,5].map(p => <SelectItem key={p} value={String(p)}>P{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="estimated_hours" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.actions.estimatedHours')}</FormLabel><FormControl><Input type="number" step="0.5" min="0.5" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t('common.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="planned">{t('workload.status.planned')}</SelectItem>
                      <SelectItem value="scheduled">{t('workload.status.scheduled')}</SelectItem>
                      <SelectItem value="in_progress">{t('workload.status.inProgress')}</SelectItem>
                      <SelectItem value="completed">{t('workload.status.completed')}</SelectItem>
                      <SelectItem value="blocked">{t('workload.status.blocked')}</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="planned_start" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.actions.plannedStart')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="planned_end" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.actions.plannedEnd')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="work_hours_only" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>{t('workload.actions.workHoursOnly')}</FormLabel>
                  <FormDescription className="text-xs">{t('workload.actions.workHoursOnlyHint')}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('common.loading') : t('common.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
