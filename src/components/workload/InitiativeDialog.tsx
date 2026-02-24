import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Initiative } from '@/hooks/workload/useInitiatives';

const schema = z.object({
  title: z.string().min(1).max(200),
  title_ar: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional().or(z.literal(0)),
  status: z.enum(['planned', 'in_progress', 'completed', 'on_hold']),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiative?: Initiative | null;
  objectiveId: string;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function InitiativeDialog({ open, onOpenChange, initiative, objectiveId, onSubmit, isSubmitting }: Props) {
  const { t } = useTranslation();
  const isEditing = !!initiative;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', title_ar: '', description: '', budget: 0, status: 'planned', start_date: '', end_date: '' },
  });

  useEffect(() => {
    if (initiative) {
      form.reset({
        title: initiative.title, title_ar: initiative.title_ar || '',
        description: initiative.description || '',
        budget: initiative.budget ?? 0, status: initiative.status as any,
        start_date: initiative.start_date || '', end_date: initiative.end_date || '',
      });
    } else {
      form.reset({ title: '', title_ar: '', description: '', budget: 0, status: 'planned', start_date: '', end_date: '' });
    }
  }, [initiative, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      objective_id: objectiveId,
      title_ar: data.title_ar || null,
      description: data.description || null,
      budget: data.budget || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('workload.initiatives.edit') : t('workload.initiatives.add')}</DialogTitle>
          <DialogDescription>{isEditing ? t('workload.initiatives.editDesc') : t('workload.initiatives.addDesc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.initiatives.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="title_ar" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.initiatives.titleAr')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.initiatives.description')}</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.initiatives.budget')}</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t('common.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="planned">{t('workload.status.planned')}</SelectItem>
                      <SelectItem value="in_progress">{t('workload.status.inProgress')}</SelectItem>
                      <SelectItem value="completed">{t('workload.status.completed')}</SelectItem>
                      <SelectItem value="on_hold">{t('workload.status.onHold')}</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.initiatives.startDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.initiatives.endDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
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
