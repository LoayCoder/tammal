import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/system';
import { cardVariants } from "@/theme/tokens";
import { cn } from "@/lib/utils";

export default function Support() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        icon={<Plus className="h-5 w-5 text-primary" />}
        title={t('support.title')}
        variant="card"
        actions={
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t('support.newTicket')}
          </Button>
        }
      />

      <Card className={cn(cardVariants.glass, "rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1")}>
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">{t('support.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--text-secondary)]">{t('common.noData')}</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
