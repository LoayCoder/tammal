import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface DeptNominationStat {
  departmentId: string | null;
  departmentName: string;
  nominationCount: number;
  uniqueNominees: number;
  headcount: number;
}

export interface ThemeStat {
  themeId: string;
  themeName: string;
  count: number;
}

export interface RoleStat {
  role: string;
  count: number;
}

export interface RecentNomination {
  id: string;
  nomineeName: string;
  themeName: string;
  status: string;
  submittedAt: string | null;
}

export interface DeptVotingStat {
  departmentId: string | null;
  departmentName: string;
  eligibleVoters: number;
  votesCast: number;
}

export interface VoteTimelineDatum {
  date: string;
  count: number;
}

export function useRecognitionMonitor(cycleId: string) {
  const { tenantId } = useTenantId();

  // ── Nominations data ──
  const { data: nominations = [], isPending: nomLoading } = useQuery({
    queryKey: ['recognition-monitor-nominations', cycleId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('id, nominee_id, nominator_role, theme_id, nominee_department_id, status, submitted_at, headline')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId && !!tenantId,
  });

  // ── Votes data ──
  const { data: votes = [], isPending: voteLoading } = useQuery({
    queryKey: ['recognition-monitor-votes', cycleId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('id, voter_id, voter_department_id, theme_id, voted_at')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId && !!tenantId,
  });

  // ── Departments ──
  const { data: departments = [] } = useQuery({
    queryKey: ['recognition-monitor-departments', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, name_ar')
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // ── Employees per department (headcount) ──
  const { data: employees = [] } = useQuery({
    queryKey: ['recognition-monitor-employees', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, user_id, department_id, full_name')
        .is('deleted_at', null)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // ── Themes ──
  const { data: themes = [] } = useQuery({
    queryKey: ['recognition-monitor-themes', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_themes')
        .select('id, name, name_ar')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId,
  });

  // ── Computed stats ──
  const deptMap = new Map(departments.map(d => [d.id, d]));
  const themeMap = new Map(themes.map(t => [t.id, t]));

  // Department nomination stats
  const deptNomMap = new Map<string, { nominations: Set<string>; nominees: Set<string> }>();
  for (const n of nominations) {
    const deptId = n.nominee_department_id ?? 'unknown';
    if (!deptNomMap.has(deptId)) deptNomMap.set(deptId, { nominations: new Set(), nominees: new Set() });
    const entry = deptNomMap.get(deptId)!;
    entry.nominations.add(n.id);
    entry.nominees.add(n.nominee_id);
  }

  const deptHeadcountMap = new Map<string, number>();
  for (const emp of employees) {
    const dId = emp.department_id ?? 'unknown';
    deptHeadcountMap.set(dId, (deptHeadcountMap.get(dId) ?? 0) + 1);
  }

  const deptNominationStats: DeptNominationStat[] = departments.map(d => ({
    departmentId: d.id,
    departmentName: d.name,
    nominationCount: deptNomMap.get(d.id)?.nominations.size ?? 0,
    uniqueNominees: deptNomMap.get(d.id)?.nominees.size ?? 0,
    headcount: deptHeadcountMap.get(d.id) ?? 0,
  }));

  // Theme distribution
  const themeDistribution: ThemeStat[] = themes.map(t => ({
    themeId: t.id,
    themeName: t.name,
    count: nominations.filter(n => n.theme_id === t.id).length,
  }));

  // Nominator role split
  const roleMap = new Map<string, number>();
  for (const n of nominations) {
    roleMap.set(n.nominator_role, (roleMap.get(n.nominator_role) ?? 0) + 1);
  }
  const roleSplit: RoleStat[] = Array.from(roleMap, ([role, count]) => ({ role, count }));

  // Recent nominations (latest 10)
  const empMap = new Map(employees.map(e => [e.user_id, e.full_name]));
  const recentNominations: RecentNomination[] = [...nominations]
    .sort((a, b) => (b.submitted_at ?? b.id).localeCompare(a.submitted_at ?? a.id))
    .slice(0, 10)
    .map(n => ({
      id: n.id,
      nomineeName: empMap.get(n.nominee_id) ?? 'Unknown',
      themeName: themeMap.get(n.theme_id)?.name ?? 'Unknown',
      status: n.status,
      submittedAt: n.submitted_at,
    }));

  // Department voting stats
  const deptVoteMap = new Map<string, Set<string>>();
  for (const v of votes) {
    const deptId = v.voter_department_id ?? 'unknown';
    if (!deptVoteMap.has(deptId)) deptVoteMap.set(deptId, new Set());
    deptVoteMap.get(deptId)!.add(v.voter_id);
  }

  const deptVotingStats: DeptVotingStat[] = departments.map(d => ({
    departmentId: d.id,
    departmentName: d.name,
    eligibleVoters: deptHeadcountMap.get(d.id) ?? 0,
    votesCast: deptVoteMap.get(d.id)?.size ?? 0,
  }));

  // Theme voting progress
  const themeVotingStats = themes.map(t => ({
    themeId: t.id,
    themeName: t.name,
    totalVotes: votes.filter(v => v.theme_id === t.id).length,
  }));

  // Voting timeline
  const timelineMap = new Map<string, number>();
  for (const v of votes) {
    const date = v.voted_at?.slice(0, 10) ?? '';
    if (date) timelineMap.set(date, (timelineMap.get(date) ?? 0) + 1);
  }
  const votingTimeline: VoteTimelineDatum[] = Array.from(timelineMap, ([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // KPIs
  const totalNominations = nominations.length;
  const uniqueNominees = new Set(nominations.map(n => n.nominee_id)).size;
  const participatingDepts = deptNominationStats.filter(d => d.nominationCount > 0).length;
  const missingDepts = deptNominationStats.filter(d => d.nominationCount === 0).length;
  const totalVotes = votes.length;
  const uniqueVoters = new Set(votes.map(v => v.voter_id)).size;
  const totalEligible = employees.length;
  const votingCompletion = totalEligible > 0 ? Math.round((uniqueVoters / totalEligible) * 100) : 0;

  return {
    isPending: nomLoading || voteLoading,
    // KPIs
    totalNominations,
    uniqueNominees,
    participatingDepts,
    missingDepts,
    totalVotes,
    uniqueVoters,
    votingCompletion,
    // Breakdowns
    deptNominationStats,
    themeDistribution,
    roleSplit,
    recentNominations,
    deptVotingStats,
    themeVotingStats,
    votingTimeline,
  };
}
