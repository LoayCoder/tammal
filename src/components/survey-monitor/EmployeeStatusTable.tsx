import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { EmployeeStatus } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  employees: EmployeeStatus[];
  isLoading: boolean;
}

export function EmployeeStatusTable({ employees, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'status' | 'progress' | 'name'>('status');

  const filtered = useMemo(() => {
    let list = employees;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.employeeName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q)
      );
    }

    const statusOrder = { not_started: 0, in_progress: 1, completed: 2 };
    return [...list].sort((a, b) => {
      if (sortBy === 'status') return statusOrder[a.status] - statusOrder[b.status];
      if (sortBy === 'progress') return (b.answeredQuestions / b.totalQuestions) - (a.answeredQuestions / a.totalQuestions);
      return a.employeeName.localeCompare(b.employeeName);
    });
  }, [employees, search, sortBy]);

  const statusBadge = (status: EmployeeStatus['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-chart-1/15 text-chart-1 border-chart-1/30">{t('surveyMonitor.employeeStatus.completed')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30">{t('surveyMonitor.employeeStatus.inProgress')}</Badge>;
      case 'not_started':
        return <Badge variant="secondary">{t('surveyMonitor.employeeStatus.notStarted')}</Badge>;
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('surveyMonitor.employeeStatus.title')}
          <Badge variant="outline" className="ms-1">{employees.length}</Badge>
        </CardTitle>
        <div className="relative w-56">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="ps-8 h-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
        ) : (
          <div className="relative w-full overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => setSortBy('name')}
                  >
                    {t('surveyMonitor.employeeStatus.name')}
                  </TableHead>
                  <TableHead>{t('surveyMonitor.employeeStatus.department')}</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => setSortBy('status')}
                  >
                    {t('common.status')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => setSortBy('progress')}
                  >
                    {t('surveyMonitor.employeeStatus.progress')}
                  </TableHead>
                  <TableHead>{t('surveyMonitor.employeeStatus.lastActivity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(emp => (
                  <TableRow key={emp.employeeId}>
                    <TableCell className="font-medium">{emp.employeeName}</TableCell>
                    <TableCell>
                      {isAr && emp.departmentNameAr ? emp.departmentNameAr : emp.departmentName}
                    </TableCell>
                    <TableCell>{statusBadge(emp.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {emp.answeredQuestions}/{emp.totalQuestions}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.lastActivity ? format(parseISO(emp.lastActivity), 'MMM dd, HH:mm') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
