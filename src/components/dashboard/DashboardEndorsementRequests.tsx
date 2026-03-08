import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEndorsements } from '@/hooks/recognition/useEndorsements';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ChevronRight } from 'lucide-react';

export function DashboardEndorsementRequests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { myEndorsementRequests, requestsPending } = useEndorsements();

  const nomineeIds = [...new Set(myEndorsementRequests.map(n => n.nominee_id))];

  const { data: nameMap = {} } = useQuery({
    queryKey: ['endorsement-nominee-names', nomineeIds],
    queryFn: async () => {
      if (!nomineeIds.length) return {};
      const { data } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', nomineeIds)
        .is('deleted_at', null);
      const map: Record<string, string> = {};
      data?.forEach(e => { if (e.user_id) map[e.user_id] = e.full_name; });
      return map;
    },
    enabled: nomineeIds.length > 0,
  });

  if (requestsPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (myEndorsementRequests.length === 0) return null;

  return (
    <div className="space-y-2">
      {myEndorsementRequests.map(n => (
        <Card
          key={n.id}
          className="glass-card border-0 ring-1 ring-chart-3/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-3/40"
          onClick={() => navigate('/recognition/my-nominations?tab=endorse')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-3/10">
              <ThumbsUp className="h-7 w-7 text-chart-3" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base">{n.headline}</h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {nameMap[n.nominee_id]
                  ? t('recognition.endorsements.endorseFor', { name: nameMap[n.nominee_id] })
                  : t('recognition.endorsements.submitEndorsement')}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
