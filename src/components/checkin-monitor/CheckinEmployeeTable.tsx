import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import type { CheckinEmployeeRow } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  employees: CheckinEmployeeRow[];
  isLoading: boolean;
}

export function CheckinEmployeeTable({ employees, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'status' | 'streak' | 'mood' | 'name'>('status');

  const filtered = useMemo(() => {
    let list = employees;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.employeeName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'status') {
        return (a.checkedInToday ? 1 : 0) - (b.checkedInToday ? 1 : 0);
      }
      if (sortBy === 'streak') return (b.streak ?? 0) - (a.streak ?? 0);
      if (sortBy === 'mood') return (b.moodScore ?? 0) - (a.moodScore ?? 0);
      return a.employeeName.localeCompare(b.employeeName);
    });
  }, [employees, search, sortBy]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('checkinMonitor.employeeTable.title')}
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
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy('name')}>
                    {t('checkinMonitor.employeeTable.name')}
                  </TableHead>
                  <TableHead>{t('checkinMonitor.employeeTable.department')}</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy('status')}>
                    {t('common.status')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy('mood')}>
                    {t('checkinMonitor.employeeTable.mood')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setSortBy('streak')}>
                    {t('checkinMonitor.employeeTable.streak')}
                  </TableHead>
                  <TableHead>{t('checkinMonitor.employeeTable.lastCheckin')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(emp => (
                  <TableRow key={emp.employeeId}>
                    <TableCell className="font-medium">{emp.employeeName}</TableCell>
                    <TableCell>{isAr && emp.departmentNameAr ? emp.departmentNameAr : emp.departmentName}</TableCell>
                    <TableCell>
                      {emp.checkedInToday ? (
                        <Badge className="bg-chart-1/15 text-chart-1 border-chart-1/30">
                          {t('checkinMonitor.employeeTable.checkedIn')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t('checkinMonitor.employeeTable.notYet')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.moodEmoji ? (
                        <span className="text-lg">{emp.moodEmoji}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{emp.streak}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.lastCheckinDate ?? '—'}
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
