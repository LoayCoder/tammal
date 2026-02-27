/**
 * Schedule Service — wraps schedule-related database queries and edge function calls.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch unique departments for a tenant's active employees.
 */
export async function fetchDepartments(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('department')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .not('department', 'is', null);

  if (error) throw error;
  return [...new Set((data || []).map(d => d.department).filter(Boolean))] as string[];
}

export interface ScheduleEmployee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

/**
 * Fetch active employees for a tenant.
 */
export async function fetchEmployees(tenantId: string): Promise<ScheduleEmployee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, department')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('status', 'active')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

/**
 * Run the schedule engine edge function for a given schedule.
 */
export async function runScheduleNow(scheduleId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('schedule-engine', {
    body: { scheduleId, generateForDays: 7 },
  });
  if (error) throw error;
  return data?.message || 'Success';
}

/**
 * Fetch scheduled questions with employee info for preview.
 */
export async function fetchSchedulePreview(scheduleId: string) {
  const { data: sqData, error: sqError } = await supabase
    .from('scheduled_questions')
    .select(`
      id, status, scheduled_delivery, actual_delivery, question_id, question_source,
      employee:employees(id, full_name, email, department, department_id, branch_id, section_id,
        branch:branches!employees_branch_id_fkey(id, name, name_ar),
        dept:departments!employees_department_id_fkey(id, name, name_ar),
        section:sites!employees_section_id_fkey(id, name, name_ar)
      )
    `)
    .eq('schedule_id', scheduleId)
    .order('scheduled_delivery', { ascending: false })
    .limit(500);

  if (sqError) throw sqError;

  const rows = sqData || [];

  // Group question IDs by source table
  const idsBySource: Record<string, string[]> = {};
  for (const row of rows) {
    const src = row.question_source || 'questions';
    if (!idsBySource[src]) idsBySource[src] = [];
    idsBySource[src].push(row.question_id);
  }

  // Fetch question texts from each source
  const questionMap: Record<string, { id: string; text: string; text_ar?: string | null; type?: string }> = {};
  const fetches: Promise<void>[] = [];

  if (idsBySource['questions']?.length) {
    fetches.push(
      Promise.resolve(supabase.from('questions').select('id, text, text_ar, type').in('id', idsBySource['questions']))
        .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = q; }); })
    );
  }
  if (idsBySource['wellness_questions']?.length) {
    fetches.push(
      Promise.resolve(supabase.from('wellness_questions').select('id, question_text_en, question_text_ar, question_type').in('id', idsBySource['wellness_questions']))
        .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = { id: q.id, text: q.question_text_en, text_ar: q.question_text_ar, type: q.question_type }; }); })
    );
  }
  if (idsBySource['generated_questions']?.length) {
    fetches.push(
      Promise.resolve(supabase.from('generated_questions').select('id, question_text, question_text_ar, type').in('id', idsBySource['generated_questions']))
        .then(({ data }) => { (data || []).forEach(q => { questionMap[q.id] = { id: q.id, text: q.question_text, text_ar: q.question_text_ar, type: q.type }; }); })
    );
  }

  await Promise.all(fetches);

  return rows.map(row => ({ ...row, question: questionMap[row.question_id] || null }));
}
