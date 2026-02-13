import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useWellnessScheduleSettings } from '@/hooks/useWellnessScheduleSettings';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const DAYS = [
  { value: 0, labelKey: 'wellness.days.sun' },
  { value: 1, labelKey: 'wellness.days.mon' },
  { value: 2, labelKey: 'wellness.days.tue' },
  { value: 3, labelKey: 'wellness.days.wed' },
  { value: 4, labelKey: 'wellness.days.thu' },
  { value: 5, labelKey: 'wellness.days.fri' },
  { value: 6, labelKey: 'wellness.days.sat' },
];

const schema = z.object({
  delivery_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  active_days: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
  questions_per_day: z.number().min(1).max(10),
  workdays_only: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function WellnessSettings() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || null;
  const { settings, isLoading, upsert } = useWellnessScheduleSettings(tenantId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      delivery_time: settings?.delivery_time?.substring(0, 5) || '09:00',
      active_days: (settings?.active_days as number[]) || [1, 2, 3, 4, 5],
      questions_per_day: settings?.questions_per_day || 1,
      workdays_only: settings?.workdays_only ?? true,
      is_active: settings?.is_active ?? true,
    },
  });

  const onSubmit = (values: FormValues) => {
    upsert.mutate(values);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('wellness.settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('wellness.settingsDescription')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('wellness.deliveryConfig')}</CardTitle>
              <CardDescription>{t('wellness.deliveryConfigDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>{t('wellness.enableSchedule')}</FormLabel>
                      <FormDescription>{t('wellness.enableScheduleDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('wellness.deliveryTime')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="max-w-[200px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questions_per_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('wellness.questionsPerDay')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={1} max={10}
                        value={field.value}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className="max-w-[200px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workdays_only"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>{t('wellness.workdaysOnly')}</FormLabel>
                      <FormDescription>{t('wellness.workdaysOnlyDesc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active_days"
                render={() => (
                  <FormItem>
                    <FormLabel>{t('wellness.activeDays')}</FormLabel>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {DAYS.map(day => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="active_days"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={checked => {
                                    const updated = checked
                                      ? [...(field.value || []), day.value]
                                      : field.value?.filter((v: number) => v !== day.value);
                                    field.onChange(updated);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{t(day.labelKey)}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('common.save')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
