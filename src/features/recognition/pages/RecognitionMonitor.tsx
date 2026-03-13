import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Users, Building2, Vote, CheckCircle, XCircle, ShieldCheck, Clock, ShieldX, Scale } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Separator } from '@/shared/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PageHeader, StatCard } from '@/shared/components/system';
import { spacing } from '@/theme/tokens';
import { cn } from '@/shared/utils/utils';
import { useAwardCycles } from '@/features/recognition/hooks/recognition/useAwardCycles';
import { useRecognitionMonitor, type RecentNomination } from '@/features/recognition/hooks/recognition/useRecognitionMonitor';
import { useFairnessSummary } from '@/features/recognition/hooks/recognition/useFairnessSummary';
import { CriteriaSummaryCard } from '@/features/recognition/components/CriteriaSummaryCard';
import { format } from 'date-fns';

const ROLE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function RecognitionMonitor() {
  const { t } = useTranslation();
  const { cycles, isPending: cyclesLoading } = useAwardCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedNomination, setSelectedNomination] = useState<RecentNomination | null>(null);

  const eligibleCycles = cycles.filter(c =>
    ['nominating', 'voting', 'calculating', 'announced'].includes(c.status)
  );

  const {
    isPending,
    allowAppeals,
    totalNominations,
    uniqueNominees,
    participatingDepts,
    missingDepts,
    totalVotes,
    votingCompletion,
    deptNominationStats,
    themeDistribution,
    roleSplit,
    recentNominations,
    deptVotingStats,
    themeVotingStats,
    votingTimeline,
    approvalStats,
    pendingApprovals,
    approvedNominations,
    rejectedByManager,
    deptApprovalStats,
  } = useRecognitionMonitor(selectedCycleId);

  const { themeFairness } = useFairnessSummary(selectedCycleId);

  return (
    <div>
      <PageHeader
        icon={<Activity className="h-5 w-5 text-primary" />}
        title={t('recognition.monitor.title')}
        subtitle={t('recognition.monitor.subtitle')}
        actions={
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder={t('recognition.monitor.selectCycle')} />
            </SelectTrigger>
            <SelectContent>
              {eligibleCycles.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} <Badge variant="outline" className="ms-2 text-xs">{t(`recognition.status.${c.status}`)}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className={cn(spacing.pageWrapper, spacing.sectionGap, 'max-w-7xl mx-auto')}>
        {!selectedCycleId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('recognition.monitor.selectCyclePrompt')}
            </CardContent>
          </Card>
        ) : isPending ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title={t('recognition.monitor.totalNominations')} value={totalNominations} icon={<Activity className="h-4 w-4 text-primary" />} />
              <StatCard title={t('recognition.monitor.uniqueNominees')} value={uniqueNominees} icon={<Users className="h-4 w-4 text-primary" />} />
              <StatCard title={t('recognition.monitor.deptsParticipating')} value={participatingDepts} icon={<CheckCircle className="h-4 w-4 text-chart-2" />} />
              <StatCard title={t('recognition.monitor.deptsMissing')} value={missingDepts} icon={<XCircle className="h-4 w-4 text-destructive" />} />
              <StatCard title={t('recognition.monitor.totalVotes')} value={totalVotes} icon={<Vote className="h-4 w-4 text-primary" />} />
              <StatCard title={t('recognition.monitor.votingCompletion')} value={`${votingCompletion}%`} icon={<Building2 className="h-4 w-4 text-primary" />} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="nominations">
              <TabsList>
                <TabsTrigger value="nominations">{t('recognition.monitor.nominationsTab')}</TabsTrigger>
                {allowAppeals && (
                  <TabsTrigger value="approvals">
                    <ShieldCheck className="h-3.5 w-3.5 me-1" />
                    {t('recognition.monitor.approvalsTab', 'Manager Approvals')}
                    {pendingApprovals > 0 && (
                      <Badge variant="destructive" className="ms-1.5 text-xs px-1.5 py-0">{pendingApprovals}</Badge>
                    )}
                  </TabsTrigger>
                )}
                <TabsTrigger value="voting">{t('recognition.monitor.votingTab')}</TabsTrigger>
                <TabsTrigger value="fairness">
                  <Scale className="h-3.5 w-3.5 me-1" />
                  {t('recognition.monitor.fairnessTab')}
                </TabsTrigger>
              </TabsList>

              {/* ── Nominations Tab ── */}
              <TabsContent value="nominations" className={spacing.sectionGap}>
                {/* Department Breakdown */}
                <Card>
                  <CardHeader><CardTitle>{t('recognition.monitor.deptBreakdown')}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('recognition.monitor.department')}</TableHead>
                          <TableHead>{t('recognition.monitor.nominations')}</TableHead>
                          <TableHead>{t('recognition.monitor.uniqueNominees')}</TableHead>
                          <TableHead>{t('recognition.monitor.headcount')}</TableHead>
                          <TableHead>{t('recognition.monitor.rate')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptNominationStats.map(d => (
                          <TableRow key={d.departmentId ?? 'unknown'}>
                            <TableCell className="font-medium">{d.departmentName}</TableCell>
                            <TableCell>{d.nominationCount}</TableCell>
                            <TableCell>{d.uniqueNominees}</TableCell>
                            <TableCell>{d.headcount}</TableCell>
                            <TableCell>
                              {d.headcount > 0 ? `${Math.round((d.nominationCount / d.headcount) * 100)}%` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {deptNominationStats.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('recognition.monitor.noData')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Theme Distribution */}
                  <Card>
                    <CardHeader><CardTitle>{t('recognition.monitor.themeDistribution')}</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={themeDistribution}>
                          <XAxis dataKey="themeName" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Role Split */}
                  <Card>
                    <CardHeader><CardTitle>{t('recognition.monitor.roleSplit')}</CardTitle></CardHeader>
                    <CardContent className="h-64 flex items-center justify-center">
                      {roleSplit.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={roleSplit} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} label={({ role, count }) => `${role}: ${count}`}>
                              {roleSplit.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-muted-foreground">{t('recognition.monitor.noData')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Nominations — Enriched */}
                <Card>
                  <CardHeader><CardTitle>{t('recognition.monitor.recentNominations')}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('recognition.monitor.nominee')}</TableHead>
                          <TableHead>{t('recognition.monitor.nominator')}</TableHead>
                          <TableHead>{t('recognition.monitor.nominatorRole')}</TableHead>
                          <TableHead>{t('recognition.monitor.department')}</TableHead>
                          <TableHead>{t('recognition.monitor.division')}</TableHead>
                          <TableHead>{t('recognition.monitor.theme')}</TableHead>
                          <TableHead>{t('recognition.monitor.status')}</TableHead>
                          {allowAppeals && <TableHead>{t('recognition.monitor.managerApproval', 'Manager Approval')}</TableHead>}
                          <TableHead>{t('recognition.monitor.date')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentNominations.map(n => (
                          <TableRow
                            key={n.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedNomination(n)}
                          >
                            <TableCell className="font-medium">{n.nomineeName}</TableCell>
                            <TableCell>{n.nominatorName}</TableCell>
                            <TableCell><Badge variant="outline">{n.nominatorRole}</Badge></TableCell>
                            <TableCell>{n.nomineeDepartmentName}</TableCell>
                            <TableCell>{n.nomineeDivisionName}</TableCell>
                            <TableCell>{n.themeName}</TableCell>
                            <TableCell><Badge variant="outline">{n.status}</Badge></TableCell>
                            {allowAppeals && (
                              <TableCell>
                                <Badge variant={
                                  n.managerApprovalStatus === 'approved' ? 'default' :
                                  n.managerApprovalStatus === 'rejected' ? 'destructive' :
                                  n.managerApprovalStatus === 'pending' ? 'secondary' : 'outline'
                                }>
                                  {n.managerApprovalStatus}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell>{n.submittedAt ? format(new Date(n.submittedAt), 'MMM d, yyyy') : '—'}</TableCell>
                          </TableRow>
                        ))}
                        {recentNominations.length === 0 && (
                          <TableRow><TableCell colSpan={allowAppeals ? 9 : 8} className="text-center text-muted-foreground py-8">{t('recognition.monitor.noData')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Approvals Tab ── */}
              {allowAppeals && (
                <TabsContent value="approvals" className={spacing.sectionGap}>
                  {/* Approval KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title={t('recognition.monitor.pendingApprovals', 'Pending Approvals')} value={pendingApprovals} icon={<Clock className="h-4 w-4 text-warning" />} />
                    <StatCard title={t('recognition.monitor.approved', 'Approved')} value={approvedNominations} icon={<ShieldCheck className="h-4 w-4 text-chart-2" />} />
                    <StatCard title={t('recognition.monitor.rejectedByManager', 'Rejected by Manager')} value={rejectedByManager} icon={<ShieldX className="h-4 w-4 text-destructive" />} />
                    <StatCard
                      title={t('recognition.monitor.approvalRate', 'Approval Rate')}
                      value={
                        (approvedNominations + rejectedByManager) > 0
                          ? `${Math.round((approvedNominations / (approvedNominations + rejectedByManager)) * 100)}%`
                          : '—'
                      }
                      icon={<CheckCircle className="h-4 w-4 text-primary" />}
                    />
                  </div>

                  {/* Approval Status Pie Chart */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader><CardTitle>{t('recognition.monitor.approvalStatusBreakdown', 'Approval Status Breakdown')}</CardTitle></CardHeader>
                      <CardContent className="h-64 flex items-center justify-center">
                        {approvalStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={approvalStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`}>
                                {approvalStats.map((entry, i) => (
                                  <Cell key={i} fill={
                                    entry.status === 'approved' ? 'hsl(var(--chart-2))' :
                                    entry.status === 'rejected' ? 'hsl(var(--destructive))' :
                                    entry.status === 'pending' ? 'hsl(var(--chart-4))' :
                                    'hsl(var(--muted-foreground))'
                                  } />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-muted-foreground">{t('recognition.monitor.noData')}</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card>
                      <CardHeader><CardTitle>{t('recognition.monitor.approvalInfo', 'How It Works')}</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {t('recognition.monitor.approvalInfoDesc', 'When "Allow Appeals" is enabled for this cycle, every nomination requires explicit approval from the nominee\'s direct manager before it becomes valid for voting.')}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">pending</Badge>
                            <span className="text-sm text-muted-foreground">{t('recognition.monitor.pendingDesc', 'Awaiting manager review')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">approved</Badge>
                            <span className="text-sm text-muted-foreground">{t('recognition.monitor.approvedDesc', 'Manager approved — eligible for voting')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">rejected</Badge>
                            <span className="text-sm text-muted-foreground">{t('recognition.monitor.rejectedDesc', 'Manager rejected — not eligible')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Department Approval Breakdown */}
                  <Card>
                    <CardHeader><CardTitle>{t('recognition.monitor.deptApprovalBreakdown', 'Department Approval Breakdown')}</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('recognition.monitor.department')}</TableHead>
                            <TableHead>{t('recognition.monitor.pendingApprovals', 'Pending')}</TableHead>
                            <TableHead>{t('recognition.monitor.approved', 'Approved')}</TableHead>
                            <TableHead>{t('recognition.monitor.rejectedByManager', 'Rejected')}</TableHead>
                            <TableHead>{t('recognition.monitor.approvalRate', 'Approval Rate')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deptApprovalStats.filter(d => d.pending + d.approved + d.rejected > 0).map(d => {
                            const total = d.approved + d.rejected;
                            const rate = total > 0 ? Math.round((d.approved / total) * 100) : null;
                            return (
                              <TableRow key={d.departmentId ?? 'unknown'}>
                                <TableCell className="font-medium">{d.departmentName}</TableCell>
                                <TableCell>
                                  {d.pending > 0 ? <Badge variant="secondary">{d.pending}</Badge> : '0'}
                                </TableCell>
                                <TableCell>
                                  {d.approved > 0 ? <Badge variant="default">{d.approved}</Badge> : '0'}
                                </TableCell>
                                <TableCell>
                                  {d.rejected > 0 ? <Badge variant="destructive">{d.rejected}</Badge> : '0'}
                                </TableCell>
                                <TableCell>
                                  {rate !== null ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={rate} className="flex-1 h-2" />
                                      <span className="text-sm text-muted-foreground w-10 text-end">{rate}%</span>
                                    </div>
                                  ) : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {deptApprovalStats.filter(d => d.pending + d.approved + d.rejected > 0).length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('recognition.monitor.noData')}</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ── Voting Tab ── */}
              <TabsContent value="voting" className={spacing.sectionGap}>
                {/* Department Voting Progress */}
                <Card>
                  <CardHeader><CardTitle>{t('recognition.monitor.deptVotingProgress')}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('recognition.monitor.department')}</TableHead>
                          <TableHead>{t('recognition.monitor.eligibleVoters')}</TableHead>
                          <TableHead>{t('recognition.monitor.votesCast')}</TableHead>
                          <TableHead>{t('recognition.monitor.completion')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptVotingStats.map(d => {
                          const pct = d.eligibleVoters > 0 ? Math.round((d.votesCast / d.eligibleVoters) * 100) : 0;
                          return (
                            <TableRow key={d.departmentId ?? 'unknown'}>
                              <TableCell className="font-medium">{d.departmentName}</TableCell>
                              <TableCell>{d.eligibleVoters}</TableCell>
                              <TableCell>{d.votesCast}</TableCell>
                              <TableCell className="min-w-[140px]">
                                <div className="flex items-center gap-2">
                                  <Progress value={pct} className="flex-1 h-2" />
                                  <span className="text-sm text-muted-foreground w-10 text-end">{pct}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {deptVotingStats.length === 0 && (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('recognition.monitor.noData')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Theme Voting Progress */}
                  <Card>
                    <CardHeader><CardTitle>{t('recognition.monitor.themeVotingProgress')}</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={themeVotingStats}>
                          <XAxis dataKey="themeName" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="totalVotes" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Voting Timeline */}
                  <Card>
                    <CardHeader><CardTitle>{t('recognition.monitor.votingTimeline')}</CardTitle></CardHeader>
                    <CardContent className="h-64">
                      {votingTimeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={votingTimeline}>
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          {t('recognition.monitor.noData')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              {/* ── Fairness Tab ── */}
              <TabsContent value="fairness" className={spacing.sectionGap}>
                {themeFairness.length === 0 || themeFairness.every(tf => tf.nominees.length === 0) ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {t('recognition.monitor.fairnessEmpty')}
                    </CardContent>
                  </Card>
                ) : (
                  themeFairness.filter(tf => tf.nominees.length > 0).map(tf => (
                    <Card key={tf.themeId}>
                      <CardHeader>
                        <CardTitle className="text-base">{tf.themeName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {tf.nominees.map(nom => (
                          <div key={nom.nominationId} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {t('recognition.monitor.fairnessNominee', { name: nom.nomineeName })}
                            </h4>
                            <CriteriaSummaryCard stages={nom.stages} />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* ── Nomination Detail Dialog ── */}
      <Dialog open={!!selectedNomination} onOpenChange={(open) => !open && setSelectedNomination(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedNomination && (
            <>
              <DialogHeader>
                <DialogTitle>{t('recognition.monitor.nominationDetails')}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Nominee Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.nominee')}</h4>
                  <p className="font-semibold text-lg">{selectedNomination.nomineeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNomination.nomineeDivisionName} → {selectedNomination.nomineeDepartmentName} → {selectedNomination.nomineeSectionName}
                  </p>
                </div>

                <Separator />

                {/* Nominator Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.nominator')}</h4>
                    <p className="font-medium">{selectedNomination.nominatorName}</p>
                    <p className="text-sm text-muted-foreground">{selectedNomination.nominatorDepartmentName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.nominatorRole')}</h4>
                    <Badge variant="outline">{selectedNomination.nominatorRole}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Theme, Status, Endorsement */}
                <div className={cn("grid gap-4", allowAppeals ? "grid-cols-4" : "grid-cols-3")}>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.theme')}</h4>
                    <p className="font-medium">{selectedNomination.themeName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.status')}</h4>
                    <Badge variant="outline">{selectedNomination.status}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.endorsementStatus')}</h4>
                    <Badge variant="secondary">{selectedNomination.endorsementStatus}</Badge>
                  </div>
                  {allowAppeals && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.managerApproval', 'Manager Approval')}</h4>
                      <Badge variant={
                        selectedNomination.managerApprovalStatus === 'approved' ? 'default' :
                        selectedNomination.managerApprovalStatus === 'rejected' ? 'destructive' :
                        selectedNomination.managerApprovalStatus === 'pending' ? 'secondary' : 'outline'
                      }>
                        {selectedNomination.managerApprovalStatus}
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Headline */}
                {selectedNomination.headline && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.headline')}</h4>
                    <p className="font-medium">{selectedNomination.headline}</p>
                  </div>
                )}

                {/* Justification */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.justification')}</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedNomination.justification || '—'}</p>
                </div>

                {/* Specific Examples */}
                {selectedNomination.specificExamples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.specificExamples')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedNomination.specificExamples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Impact Metrics */}
                {selectedNomination.impactMetrics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.impactMetrics')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedNomination.impactMetrics.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Date */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('recognition.monitor.date')}</h4>
                  <p className="text-sm">{selectedNomination.submittedAt ? format(new Date(selectedNomination.submittedAt), 'MMM d, yyyy HH:mm') : '—'}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




