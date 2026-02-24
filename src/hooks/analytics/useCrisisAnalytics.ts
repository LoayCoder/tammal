import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface CrisisAnalytics {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  escalatedCases: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionHours: number | null;
  riskDistribution: { risk: string; count: number }[];
  intentDistribution: { intent: string; count: number }[];
  monthlyCases: { month: string; count: number }[];
  firstAiderLoad: { name: string; active: number; resolved: number }[];
}

export function useCrisisAnalytics(tenantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mh-crisis-analytics', tenantId],
    queryFn: async (): Promise<CrisisAnalytics> => {
      // Fetch all cases for tenant
      let query = supabase
        .from('mh_crisis_cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: cases = [], error } = await query;
      if (error) throw error;

      // Fetch first aiders for load analysis
      let faQuery = supabase
        .from('mh_first_aiders')
        .select('id, display_name')
        .is('deleted_at', null);
      if (tenantId) faQuery = faQuery.eq('tenant_id', tenantId);
      const { data: aiders = [] } = await faQuery;

      const totalCases = cases.length;
      const activeCases = cases.filter(c => ['active', 'awaiting_user', 'awaiting_first_aider', 'pending_first_aider_acceptance', 'pending_assignment'].includes(c.status)).length;
      const resolvedCases = cases.filter(c => ['resolved', 'closed'].includes(c.status)).length;
      const escalatedCases = cases.filter(c => c.status === 'escalated').length;

      // Avg first response time (cases with first_response_at and created_at)
      const responseTimes = cases
        .filter(c => c.first_response_at && c.created_at)
        .map(c => (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()) / 60000);
      const avgFirstResponseMinutes = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

      // Avg resolution time
      const resolutionTimes = cases
        .filter(c => c.resolved_at && c.created_at)
        .map(c => (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 3600000);
      const avgResolutionHours = resolutionTimes.length > 0
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length * 10) / 10
        : null;

      // Risk distribution
      const riskMap: Record<string, number> = {};
      cases.forEach(c => { riskMap[c.risk_level] = (riskMap[c.risk_level] || 0) + 1; });
      const riskDistribution = Object.entries(riskMap).map(([risk, count]) => ({ risk, count }));

      // Intent distribution
      const intentMap: Record<string, number> = {};
      cases.forEach(c => { intentMap[c.intent] = (intentMap[c.intent] || 0) + 1; });
      const intentDistribution = Object.entries(intentMap)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly cases (last 6 months)
      const monthlyCases: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const count = cases.filter(c => {
          const cd = new Date(c.created_at);
          return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
        }).length;
        monthlyCases.push({ month: monthKey, count });
      }

      // First aider load
      const firstAiderLoad = (aiders || []).map((fa: any) => {
        const faCases = cases.filter(c => c.assigned_first_aider_id === fa.id);
        return {
          name: fa.display_name,
          active: faCases.filter(c => ['active', 'awaiting_user', 'awaiting_first_aider', 'pending_first_aider_acceptance'].includes(c.status)).length,
          resolved: faCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
        };
      });

      return {
        totalCases, activeCases, resolvedCases, escalatedCases,
        avgFirstResponseMinutes, avgResolutionHours,
        riskDistribution, intentDistribution, monthlyCases, firstAiderLoad,
      };
    },
    enabled: !!user?.id,
  });
}
