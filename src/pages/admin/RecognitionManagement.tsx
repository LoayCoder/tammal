import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trophy, Calendar, Users, Vote } from 'lucide-react';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { CycleStatusBadge } from '@/components/recognition/CycleStatusBadge';
import { CycleTimeline } from '@/components/recognition/CycleTimeline';
import { CycleBuilder } from '@/components/recognition/CycleBuilder';
import { format } from 'date-fns';

export default function RecognitionManagement() {
  const { t } = useTranslation();
  const { cycles, isLoading } = useAwardCycles();
  const [showBuilder, setShowBuilder] = useState(false);

  if (showBuilder) {
    return (
      <div className="p-6">
        <CycleBuilder onClose={() => setShowBuilder(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {t('recognition.title')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.subtitle')}</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('recognition.cycles.create')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : cycles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t('recognition.cycles.empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('recognition.cycles.emptyDescription')}</p>
            <Button className="mt-4" onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 me-2" />
              {t('recognition.cycles.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cycles.map((cycle) => (
            <Card key={cycle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cycle.name}</CardTitle>
                    <CardDescription>{t('recognition.cycles.createdAt', { date: format(new Date(cycle.created_at), 'MMM d, yyyy') })}</CardDescription>
                  </div>
                  <CycleStatusBadge status={cycle.status as any} />
                </div>
              </CardHeader>
              <CardContent>
                <CycleTimeline cycle={cycle} />
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{t('recognition.cycles.auditDaysLabel', { days: cycle.audit_review_days })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
