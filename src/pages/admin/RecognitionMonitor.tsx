import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Users, Building2, Vote, CheckCircle, XCircle, ShieldCheck, Clock, ShieldX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PageHeader, StatCard } from '@/components/system';
import { spacing } from '@/theme/tokens';
import { cn } from '@/lib/utils';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { useRecognitionMonitor, type RecentNomination } from '@/hooks/recognition/useRecognitionMonitor';
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
                <TabsTrigger value="voting">{t('recognition.monitor.votingTab')}</TabsTrigger>
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
                            <TableCell>{n.submittedAt ? format(new Date(n.submittedAt), 'MMM d, yyyy') : '—'}</TableCell>
                          </TableRow>
                        ))}
                        {recentNominations.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t('recognition.monitor.noData')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

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
                <div className="grid grid-cols-3 gap-4">
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
