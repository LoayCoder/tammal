import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Loader2, BarChart3, ChevronDown, Filter, X, Building2, GitBranch, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PreviewQuestion {
  id: string;
  status: string;
  scheduled_delivery: string;
  actual_delivery?: string;
  question_id: string;
  question_source?: string;
  employee?: {
    id?: string;
    full_name?: string;
    email?: string;
    department?: string | null;
    department_id?: string | null;
    branch_id?: string | null;
    section_id?: string | null;
    branch?: { id?: string; name?: string; name_ar?: string } | any;
    dept?: { id?: string; name?: string; name_ar?: string } | any;
    section?: { id?: string; name?: string; name_ar?: string } | any;
  } | null;
  question?: { id?: string; text?: string; text_ar?: string; type?: string } | null;
}

interface SchedulePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewQuestions: PreviewQuestion[];
  previewLoading: boolean;
}

const STATUS_OPTIONS = ['pending', 'delivered', 'answered', 'skipped', 'expired', 'failed'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--muted-foreground))',
  delivered: 'hsl(var(--primary))',
  answered: 'hsl(142, 71%, 45%)',
  skipped: 'hsl(0, 84%, 60%)',
  expired: 'hsl(25, 95%, 53%)',
  failed: 'hsl(0, 72%, 51%)',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(var(--muted-foreground))', 'hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(0, 72%, 51%)'];

export default function SchedulePreviewDialog({ open, onOpenChange, previewQuestions, previewLoading }: SchedulePreviewDialogProps) {
  const { t } = useTranslation();

  // View question detail state
  const [viewSq, setViewSq] = useState<PreviewQuestion | null>(null);

  // Filter state
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Helper to unwrap array joins
  const getEmpBranch = (sq: PreviewQuestion) => {
    const b = sq.employee?.branch;
    return Array.isArray(b) ? b[0] : b;
  };
  const getEmpDept = (sq: PreviewQuestion): { id?: string; name?: string; name_ar?: string } | null => {
    // Use FK join first, fallback to text department field
    const d = sq.employee?.dept;
    const resolved = Array.isArray(d) ? d[0] : d;
    if (resolved?.id) return resolved;
    // Fallback: use text department field as name
    if (sq.employee?.department) {
      return { name: sq.employee.department };
    }
    return null;
  };
  const getEmpSection = (sq: PreviewQuestion): { id?: string; name?: string; name_ar?: string } | null => {
    const s = sq.employee?.section;
    return Array.isArray(s) ? s[0] : s;
  };

  // Unique employees from data
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, string>();
    previewQuestions.forEach(sq => {
      const emp = sq.employee;
      if (emp?.id && emp?.full_name) map.set(emp.id, emp.full_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [previewQuestions]);

  // Unique branches
  const uniqueBranches = useMemo(() => {
    const map = new Map<string, string>();
    previewQuestions.forEach(sq => {
      const b = getEmpBranch(sq);
      if (b?.id && b?.name) map.set(b.id, b.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [previewQuestions]);

  // Unique departments (from FK or text fallback)
  const uniqueDepartments = useMemo(() => {
    const map = new Map<string, string>();
    previewQuestions.forEach(sq => {
      const d = getEmpDept(sq);
      if (d?.name) {
        const key = d.id || `text:${d.name}`;
        map.set(key, d.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [previewQuestions]);

  // Unique sections
  const uniqueSections = useMemo(() => {
    const map = new Map<string, string>();
    previewQuestions.forEach(sq => {
      const s = getEmpSection(sq);
      if (s?.id && s?.name) map.set(s.id, s.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [previewQuestions]);

  // Filtered data
  const filteredPreview = useMemo(() => {
    return previewQuestions.filter(sq => {
      if (filterDateFrom && sq.scheduled_delivery < filterDateFrom) return false;
      if (filterDateTo && sq.scheduled_delivery > filterDateTo + 'T23:59:59') return false;
      if (filterStatuses.length > 0 && !filterStatuses.includes(sq.status)) return false;
      if (filterEmployee && filterEmployee !== 'all' && sq.employee?.id !== filterEmployee) return false;
      if (filterBranch && filterBranch !== 'all') {
        const b = getEmpBranch(sq);
        if (b?.id !== filterBranch) return false;
      }
      if (filterDepartment && filterDepartment !== 'all') {
        const d = getEmpDept(sq);
        const dKey = d?.id || (d?.name ? `text:${d.name}` : '');
        if (dKey !== filterDepartment) return false;
      }
      if (filterSection && filterSection !== 'all') {
        const s = getEmpSection(sq);
        if (s?.id !== filterSection) return false;
      }
      return true;
    });
  }, [previewQuestions, filterDateFrom, filterDateTo, filterStatuses, filterEmployee, filterBranch, filterDepartment, filterSection]);

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPreview.forEach(sq => { counts[sq.status] = (counts[sq.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPreview]);

  const timelineChartData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredPreview.forEach(sq => {
      const d = sq.scheduled_delivery ? new Date(sq.scheduled_delivery).toLocaleDateString() : 'Unknown';
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredPreview]);

  // Status by Branch
  const statusByBranchData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    filteredPreview.forEach(sq => {
      const b = getEmpBranch(sq);
      const bName = b?.name || t('common.unassigned');
      if (!map[bName]) map[bName] = {};
      map[bName][sq.status] = (map[bName][sq.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, statuses]) => ({ name, ...statuses }));
  }, [filteredPreview, t]);

  // Status by Department
  const statusByDeptData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    filteredPreview.forEach(sq => {
      const d = getEmpDept(sq);
      const dName = d?.name || t('common.unassigned');
      if (!map[dName]) map[dName] = {};
      map[dName][sq.status] = (map[dName][sq.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, statuses]) => ({ name, ...statuses }));
  }, [filteredPreview, t]);

  // Status by Section
  const statusBySectionData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    filteredPreview.forEach(sq => {
      const s = getEmpSection(sq);
      const sName = s?.name || t('common.unassigned');
      if (!map[sName]) map[sName] = {};
      map[sName][sq.status] = (map[sName][sq.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, statuses]) => ({ name, ...statuses }));
  }, [filteredPreview, t]);

  // All unique statuses for stacked bars
  const allStatuses = useMemo(() => {
    const s = new Set<string>();
    filteredPreview.forEach(sq => s.add(sq.status));
    return Array.from(s);
  }, [filteredPreview]);

  // Summary stats
  const totalCount = filteredPreview.length;
  const answeredCount = filteredPreview.filter(sq => sq.status === 'answered').length;
  const pendingCount = filteredPreview.filter(sq => sq.status === 'pending').length;
  const answeredRate = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const hasActiveFilters = filterDateFrom || filterDateTo || filterStatuses.length > 0 || filterEmployee || filterBranch || filterDepartment || filterSection;

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterStatuses([]);
    setFilterEmployee('');
    setFilterBranch('');
    setFilterDepartment('');
    setFilterSection('');
  };

  const toggleStatusFilter = (status: string) => {
    setFilterStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const getSqStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'outline',
      delivered: 'secondary',
      answered: 'default',
      skipped: 'destructive',
    };
    return <Badge variant={(map[status] || 'outline') as any}>{status}</Badge>;
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      clearFilters();
      setShowAnalytics(false);
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{t('schedules.viewScheduled')}</DialogTitle>
              <DialogDescription>
                {t('schedules.scheduledQuestionsDescription')}
                {previewQuestions.length > 0 && (
                  <span className="ms-1">({previewQuestions.length} total)</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {previewLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : previewQuestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('schedules.noScheduledQuestions')}</p>
            <p className="text-sm mt-1">{t('schedules.runToGenerate')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs">{t('common.from')}</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="h-9 w-[140px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('common.to')}</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="h-9 w-[140px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('common.status')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-start">
                      <Filter className="h-3.5 w-3.5 me-1.5" />
                      {filterStatuses.length > 0
                        ? `${filterStatuses.length} ${t('common.selected')}`
                        : t('common.all')}
                      <ChevronDown className="h-3.5 w-3.5 ms-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      {STATUS_OPTIONS.map(status => (
                        <label key={status} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                          <Checkbox
                            checked={filterStatuses.includes(status)}
                            onCheckedChange={() => toggleStatusFilter(status)}
                          />
                          <span className="text-sm capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('schedules.employee')}</Label>
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {uniqueEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {uniqueBranches.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('branches.title')}</Label>
                  <Select value={filterBranch} onValueChange={setFilterBranch}>
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {uniqueBranches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {uniqueDepartments.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('users.department')}</Label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {uniqueDepartments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {uniqueSections.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('sections.title')}</Label>
                  <Select value={filterSection} onValueChange={setFilterSection}>
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {uniqueSections.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-end gap-2 ms-auto">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5 me-1" />
                    {t('common.clear')}
                  </Button>
                )}
                <Button
                  variant={showAnalytics ? 'default' : 'outline'}
                  size="sm"
                  className="h-9"
                  onClick={() => setShowAnalytics(prev => !prev)}
                >
                  <BarChart3 className="h-3.5 w-3.5 me-1.5" />
                  {t('common.analytics')}
                </Button>
              </div>
            </div>

            {/* Analytics Section */}
            <Collapsible open={showAnalytics}>
              <CollapsibleContent>
                <div className="space-y-4 pb-2">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{totalCount}</p>
                        <p className="text-xs text-muted-foreground">{t('common.totalQuestions')}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{answeredRate}%</p>
                        <p className="text-xs text-muted-foreground">{t('common.answeredRate')}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground">{t('common.pending')}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Distribution Pie */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-3">{t('common.statusDistribution')}</p>
                        {statusChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                              >
                                {statusChartData.map((entry, index) => (
                                  <Cell
                                    key={entry.name}
                                    fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Delivery Timeline Bar */}
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-3">{t('common.deliveryTimeline')}</p>
                        {timelineChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={timelineChartData}>
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Org-Level Status Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status by Branch */}
                    {statusByBranchData.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{t('branches.title')} — {t('common.statusDistribution')}</p>
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={statusByBranchData} layout="vertical">
                              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                              <Tooltip />
                              <Legend />
                              {allStatuses.map((status, i) => (
                                <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status] || PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status by Department */}
                    {statusByDeptData.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{t('users.department')} — {t('common.statusDistribution')}</p>
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={statusByDeptData} layout="vertical">
                              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                              <Tooltip />
                              <Legend />
                              {allStatuses.map((status, i) => (
                                <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status] || PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status by Section */}
                    {statusBySectionData.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{t('sections.title')} — {t('common.statusDistribution')}</p>
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={statusBySectionData} layout="vertical">
                              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                              <Tooltip />
                              <Legend />
                              {allStatuses.map((status, i) => (
                                <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status] || PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground">
                {t('common.showingOf', { shown: filteredPreview.length, total: previewQuestions.length })}
              </p>
            )}

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('schedules.employee')}</TableHead>
                  <TableHead>{t('branches.title')}</TableHead>
                  <TableHead>{t('users.department')}</TableHead>
                  <TableHead>{t('sections.title')}</TableHead>
                  <TableHead>{t('questions.questionTextEn')}</TableHead>
                  <TableHead>{t('schedules.delivery')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreview.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      {t('common.noMatchingQuestions')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPreview.map(sq => (
                    <TableRow key={sq.id}>
                      <TableCell className="text-sm">
                        {sq.employee?.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getEmpBranch(sq)?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getEmpDept(sq)?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getEmpSection(sq)?.name || '-'}
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[220px] cursor-pointer hover:bg-muted/50"
                        onClick={() => setViewSq(sq)}
                      >
                        {(() => {
                          const text = sq.question?.text || '-';
                          if (text === '-' || text.length <= 45) return <span>{text}</span>;
                          return (
                            <UiTooltip>
                              <TooltipTrigger asChild>
                                <p className="line-clamp-2 cursor-help">{text}</p>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-sm whitespace-pre-wrap">
                                <p className="text-sm">{text}</p>
                              </TooltipContent>
                            </UiTooltip>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sq.scheduled_delivery
                          ? new Date(sq.scheduled_delivery).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{getSqStatusBadge(sq.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>

      {/* Question Detail Dialog */}
      <Dialog open={!!viewSq} onOpenChange={() => setViewSq(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('questions.questionDetails')}</DialogTitle>
            <DialogDescription>{t('questions.viewQuestion')}</DialogDescription>
          </DialogHeader>
          {viewSq && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('questions.questionTextEn')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3">{viewSq.question?.text || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('questions.questionTextAr')}</p>
                <p className="text-sm bg-muted/50 rounded-md p-3" dir="rtl">{viewSq.question?.text_ar || '-'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {viewSq.question?.type && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('questions.type')}:</span>
                    <Badge variant="outline">{viewSq.question.type}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('common.status')}:</span>
                  {getSqStatusBadge(viewSq.status)}
                </div>
                {viewSq.employee?.full_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('schedules.employee')}:</span>
                    <Badge variant="secondary">{viewSq.employee.full_name}</Badge>
                  </div>
                )}
              </div>
              {viewSq.scheduled_delivery && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('schedules.delivery')}:</span>
                  <span className="text-sm">{new Date(viewSq.scheduled_delivery).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSq(null)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
