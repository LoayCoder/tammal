import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeStats {
  totalEmployees: number;
  employeesCompleted: number;
  employeesInProgress: number;
  employeesNotStarted: number;
  employeeCompletionPercent: number;
}

export interface QuestionStats {
  totalQuestions: number;
  questionsAnswered: number;
  questionsDraft: number;
  questionsExpired: number;
  questionsFailed: number;
  questionCompletionPercent: number;
}

export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  departmentNameAr: string | null;
  totalEmployees: number;
  employeesCompleted: number;
  rate: number;
}

export interface EmployeeStatus {
  employeeId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string;
  departmentNameAr: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  draftQuestions: number;
  status: 'completed' | 'in_progress' | 'not_started';
  lastActivity: string | null;
}

export interface TrendPoint {
  date: string;
  cumulativeCompleted: number;
  completionPercent: number;
}

export interface OrgFilters {
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
}

export function useSurveyMonitor(
  scheduleId?: string,
  tenantId?: string,
  filters?: OrgFilters
) {
  // Fetch active survey schedules for the selector
  const schedulesQuery = useQuery({
    queryKey: ['survey-monitor-schedules', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('question_schedules')
        .select('id, name, status, start_date, end_date, schedule_type, target_audience, created_at')
        .eq('schedule_type', 'survey')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // Core data query — fetch scheduled_questions + employees + departments
  const coreQuery = useQuery({
    queryKey: ['survey-monitor-core', scheduleId, filters?.branchId, filters?.divisionId, filters?.departmentId],
    queryFn: async () => {
      if (!scheduleId) throw new Error('No schedule');

      // 1. Get all scheduled_questions for this schedule
      const { data: sq, error: sqError } = await supabase
        .from('scheduled_questions')
        .select('id, status, employee_id, question_id')
        .eq('schedule_id', scheduleId);
      if (sqError) throw sqError;
      if (!sq || sq.length === 0) return { sq: [], employees: [], departments: [], responses: [] };

      // 2. Get unique employee IDs
      const employeeIds = [...new Set(sq.map(s => s.employee_id))];

      // 3. Fetch employees with org data
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, department_id, branch_id, section_id')
        .in('id', employeeIds)
        .is('deleted_at', null);
      if (empError) throw empError;

      // 4. Fetch departments with division linkage
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name, name_ar, division_id, branch_id')
        .is('deleted_at', null);
      if (deptError) throw deptError;

      // 5. Fetch draft responses for the scheduled question IDs
      const sqIds = sq.map(s => s.id);
      let responses: { scheduled_question_id: string; is_draft: boolean; created_at: string }[] = [];
      if (sqIds.length > 0) {
        // Batch in chunks of 500 to avoid URL length issues
        const chunks = [];
        for (let i = 0; i < sqIds.length; i += 500) {
          chunks.push(sqIds.slice(i, i + 500));
        }
        for (const chunk of chunks) {
          const { data: respData, error: respError } = await supabase
            .from('employee_responses')
            .select('scheduled_question_id, is_draft, created_at')
            .in('scheduled_question_id', chunk)
            .is('deleted_at', null);
          if (respError) throw respError;
          if (respData) responses = responses.concat(respData);
        }
      }

      return { sq, employees: employees ?? [], departments: departments ?? [], responses };
    },
    enabled: !!scheduleId,
  });

  // Compute all derived data
  const computed = (() => {
    const raw = coreQuery.data;
    if (!raw || raw.sq.length === 0) {
      return {
        employeeStats: { totalEmployees: 0, employeesCompleted: 0, employeesInProgress: 0, employeesNotStarted: 0, employeeCompletionPercent: 0 } as EmployeeStats,
        questionStats: { totalQuestions: 0, questionsAnswered: 0, questionsDraft: 0, questionsExpired: 0, questionsFailed: 0, questionCompletionPercent: 0 } as QuestionStats,
        departmentStats: [] as DepartmentStat[],
        employeeList: [] as EmployeeStatus[],
        trendData: [] as TrendPoint[],
      };
    }

    const { sq, employees, departments, responses } = raw;

    // Build lookup maps
    const deptMap = new Map(departments.map(d => [d.id, d]));
    const empMap = new Map(employees.map(e => [e.id, e]));

    // Apply org filters to employees
    let filteredEmployeeIds = new Set(employees.map(e => e.id));
    if (filters?.branchId || filters?.divisionId || filters?.departmentId) {
      filteredEmployeeIds = new Set(
        employees.filter(e => {
          if (filters.departmentId && e.department_id !== filters.departmentId) return false;
          if (filters.branchId && e.branch_id !== filters.branchId) return false;
          if (filters.divisionId) {
            const dept = e.department_id ? deptMap.get(e.department_id) : null;
            if (!dept || dept.division_id !== filters.divisionId) return false;
          }
          return true;
        }).map(e => e.id)
      );
    }

    // Filter sq by filtered employees
    const filteredSq = sq.filter(s => filteredEmployeeIds.has(s.employee_id));

    // Response lookup: scheduled_question_id -> response
    const responseMap = new Map(responses.map(r => [r.scheduled_question_id, r]));

    // Group by employee
    const empGroups = new Map<string, typeof filteredSq>();
    filteredSq.forEach(item => {
      const arr = empGroups.get(item.employee_id) ?? [];
      arr.push(item);
      empGroups.set(item.employee_id, arr);
    });

    // Build employee list
    const employeeList: EmployeeStatus[] = [];
    let employeesCompleted = 0;
    let employeesInProgress = 0;
    let employeesNotStarted = 0;

    empGroups.forEach((questions, empId) => {
      const emp = empMap.get(empId);
      const dept = emp?.department_id ? deptMap.get(emp.department_id) : null;

      const totalQ = questions.length;
      const answeredQ = questions.filter(q => q.status === 'answered').length;
      const draftQ = questions.filter(q => {
        const resp = responseMap.get(q.id);
        return resp?.is_draft === true;
      }).length;

      // Find last activity from responses
      const empResponses = questions
        .map(q => responseMap.get(q.id))
        .filter(Boolean) as { created_at: string }[];
      const lastActivity = empResponses.length > 0
        ? empResponses.reduce((latest, r) => r.created_at > latest ? r.created_at : latest, empResponses[0].created_at)
        : null;

      let status: EmployeeStatus['status'] = 'not_started';
      if (answeredQ === totalQ && totalQ > 0) {
        status = 'completed';
        employeesCompleted++;
      } else if (answeredQ > 0 || draftQ > 0) {
        status = 'in_progress';
        employeesInProgress++;
      } else {
        employeesNotStarted++;
      }

      employeeList.push({
        employeeId: empId,
        employeeName: emp?.full_name ?? 'Unknown',
        departmentId: emp?.department_id ?? null,
        departmentName: dept?.name ?? 'Unassigned',
        departmentNameAr: dept?.name_ar ?? null,
        totalQuestions: totalQ,
        answeredQuestions: answeredQ,
        draftQuestions: draftQ,
        status,
        lastActivity,
      });
    });

    const totalEmployees = employeeList.length;
    const employeeStats: EmployeeStats = {
      totalEmployees,
      employeesCompleted,
      employeesInProgress,
      employeesNotStarted,
      employeeCompletionPercent: totalEmployees > 0 ? Math.round((employeesCompleted / totalEmployees) * 100) : 0,
    };

    // Question-level stats
    const totalQuestions = filteredSq.length;
    const questionsAnswered = filteredSq.filter(q => q.status === 'answered').length;
    const questionsDraft = filteredSq.filter(q => {
      const resp = responseMap.get(q.id);
      return resp?.is_draft === true;
    }).length;
    const questionsExpired = filteredSq.filter(q => q.status === 'expired').length;
    const questionsFailed = filteredSq.filter(q => q.status === 'failed').length;
    const questionStats: QuestionStats = {
      totalQuestions,
      questionsAnswered,
      questionsDraft,
      questionsExpired,
      questionsFailed,
      questionCompletionPercent: totalQuestions > 0 ? Math.round((questionsAnswered / totalQuestions) * 100) : 0,
    };

    // Department stats (employee-level)
    const deptGroups = new Map<string, { completed: number; total: number }>();
    employeeList.forEach(e => {
      const dId = e.departmentId ?? 'unassigned';
      const cur = deptGroups.get(dId) ?? { completed: 0, total: 0 };
      cur.total++;
      if (e.status === 'completed') cur.completed++;
      deptGroups.set(dId, cur);
    });

    const departmentStats: DepartmentStat[] = Array.from(deptGroups.entries())
      .map(([dId, s]) => ({
        departmentId: dId,
        departmentName: deptMap.get(dId)?.name ?? 'Unassigned',
        departmentNameAr: deptMap.get(dId)?.name_ar ?? null,
        totalEmployees: s.total,
        employeesCompleted: s.completed,
        rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    // Live trend data from responses (cumulative by date)
    const completedEmployeeDates = new Map<string, string>(); // empId -> date they completed
    empGroups.forEach((questions, empId) => {
      const totalQ = questions.length;
      const answeredQ = questions.filter(q => q.status === 'answered').length;
      if (answeredQ === totalQ && totalQ > 0) {
        // Find the latest response date for this employee
        const empResps = questions
          .map(q => responseMap.get(q.id))
          .filter(Boolean) as { created_at: string }[];
        if (empResps.length > 0) {
          const latestDate = empResps.reduce((l, r) => r.created_at > l ? r.created_at : l, empResps[0].created_at);
          completedEmployeeDates.set(empId, latestDate.split('T')[0]);
        }
      }
    });

    // Group completions by date
    const dateCompletions = new Map<string, number>();
    completedEmployeeDates.forEach((date) => {
      dateCompletions.set(date, (dateCompletions.get(date) ?? 0) + 1);
    });

    const sortedDates = Array.from(dateCompletions.keys()).sort();
    let cumulative = 0;
    const trendData: TrendPoint[] = sortedDates.map(date => {
      cumulative += dateCompletions.get(date)!;
      return {
        date,
        cumulativeCompleted: cumulative,
        completionPercent: totalEmployees > 0 ? Math.round((cumulative / totalEmployees) * 100) : 0,
      };
    });

    return { employeeStats, questionStats, departmentStats, employeeList, trendData };
  })();

  return {
    schedules: schedulesQuery.data ?? [],
    schedulesLoading: schedulesQuery.isPending,
    employeeStats: computed.employeeStats,
    questionStats: computed.questionStats,
    departmentStats: computed.departmentStats,
    employeeList: computed.employeeList,
    trendData: computed.trendData,
    isPending: coreQuery.isPending,
    refetch: coreQuery.refetch,
  };
}
