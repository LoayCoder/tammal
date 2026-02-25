import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RiskMapping } from '@/hooks/crisis/useRiskMappings';

const schema = z.object({
  intent: z.string().min(1, 'Intent is required'),
  risk_level: z.enum(['high', 'moderate', 'low']),
  action_description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping?: RiskMapping | null;
  onSubmit: (values: { intent: string; risk_level: string; action_description?: string }) => void;
  isPending: boolean;
}

export default function RiskMappingDialog({ open, onOpenChange, mapping, onSubmit, isPending }: Props) {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { intent: '', risk_level: 'moderate', action_description: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        intent: mapping?.intent ?? '',
        risk_level: mapping?.risk_level ?? 'moderate',
        action_description: mapping?.action_description ?? '',
      });
    }
  }, [open, mapping]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mapping ? t('crisisSupport.admin.editMapping', 'Edit Risk Mapping') : t('crisisSupport.admin.addMapping', 'Add Risk Mapping')}
          </DialogTitle>
          <DialogDescription>
            {t('crisisSupport.admin.mappingDialogDesc', 'Configure how intents map to risk levels for crisis routing.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            onSubmit({
              intent: data.intent!,
              risk_level: data.risk_level!,
              action_description: data.action_description,
            });
          })} className="space-y-4">
            <FormField
              control={form.control}
              name="intent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('crisisSupport.admin.intent', 'Intent')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. self_harm, anxiety" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('crisisSupport.admin.riskLevel', 'Risk Level')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('crisisSupport.admin.action', 'Action Description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('crisisSupport.admin.actionPlaceholder', 'Optional custom action...')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {mapping ? t('common.save', 'Save') : t('common.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
