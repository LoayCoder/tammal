import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  if (myEndorsementRequests.length === 0) return null;

  return (
    <div className="space-y-3">
      {myEndorsementRequests.map(n => (
        <Card
          key={n.id}
          className="group relative overflow-hidden border-0 glass-card rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
          onClick={() => navigate('/recognition/my-nominations?tab=endorse')}
        >
          {/* Gradient accent stripe on the start edge */}
          <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-chart-3 to-chart-3/40 rounded-s-2xl" />

          <CardContent className="flex items-center gap-4 p-5 ps-6">
            {/* Icon with pulse indicator */}
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10 ring-1 ring-chart-3/20 transition-colors group-hover:bg-chart-3/20">
                <ThumbsUp className="h-6 w-6 text-chart-3" />
              </div>
              {/* Pulse dot */}
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3/60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-chart-3" />
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm truncate">{n.headline}</h3>
                <Badge variant="outline" className="shrink-0 text-2xs px-1.5 py-0 border-chart-3/30 text-chart-3">
                  {t('recognition.endorsements.status.pending')}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs truncate">
                {nameMap[n.nominee_id]
                  ? t('recognition.endorsements.endorseFor', { name: nameMap[n.nominee_id] })
                  : t('recognition.endorsements.submitEndorsement')}
              </p>
            </div>

            {/* Action hint */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="hidden sm:inline text-2xs text-muted-foreground group-hover:text-chart-3 transition-colors">
                {t('recognition.endorsements.dashboardEndorseAction')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-3 transition-colors rtl:rotate-180" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
