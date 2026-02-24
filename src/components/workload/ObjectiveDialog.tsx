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
import type { Objective } from '@/hooks/workload/useObjectives';

const schema = z.object({
  title: z.string().min(1).max(200),
  title_ar: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  description_ar: z.string().max(1000).optional().or(z.literal('')),
  year: z.coerce.number().int().min(2020).max(2050),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  status: z.enum(['on_track', 'at_risk', 'delayed', 'completed']),
  start_date: z.string().min(1),
  end_date: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective?: Objective | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function ObjectiveDialog({ open, onOpenChange, objective, onSubmit, isSubmitting }: Props) {
  const { t } = useTranslation();
  const isEditing = !!objective;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', title_ar: '', description: '', description_ar: '',
      year: new Date().getFullYear(), quarter: 'Q1', status: 'on_track',
      start_date: new Date().toISOString().split('T')[0], end_date: '',
    },
  });

  useEffect(() => {
    if (objective) {
      form.reset({
        title: objective.title, title_ar: objective.title_ar || '',
        description: objective.description || '', description_ar: objective.description_ar || '',
        year: objective.year, quarter: objective.quarter as any,
        status: objective.status as any,
        start_date: objective.start_date, end_date: objective.end_date || '',
      });
    } else {
      form.reset({
        title: '', title_ar: '', description: '', description_ar: '',
        year: new Date().getFullYear(), quarter: 'Q1', status: 'on_track',
        start_date: new Date().toISOString().split('T')[0], end_date: '',
      });
    }
  }, [objective, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      title_ar: data.title_ar || null,
      description: data.description || null,
      description_ar: data.description_ar || null,
      end_date: data.end_date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('workload.objectives.edit') : t('workload.objectives.add')}</DialogTitle>
          <DialogDescription>{isEditing ? t('workload.objectives.editDesc') : t('workload.objectives.addDesc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.objectives.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="title_ar" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.objectives.titleAr')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{t('workload.objectives.description')}</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.objectives.year')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="quarter" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.objectives.quarter')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t('common.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="on_track">{t('workload.status.onTrack')}</SelectItem>
                      <SelectItem value="at_risk">{t('workload.status.atRisk')}</SelectItem>
                      <SelectItem value="delayed">{t('workload.status.delayed')}</SelectItem>
                      <SelectItem value="completed">{t('workload.status.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.objectives.startDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem><FormLabel>{t('workload.objectives.endDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
