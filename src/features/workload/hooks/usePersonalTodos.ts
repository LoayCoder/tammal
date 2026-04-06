import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLocalDateString } from '@/utils/getLocalDate';
import { addDays } from 'date-fns';

export interface PersonalTodo {
  id: string;
  tenant_id: string;
  employee_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  priority: number;
  due_date: string | null;
  linked_task_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ParsedInput {
  title: string;
  priority: number;
  due_date: string | null;
}

/** Client-side NLP: extract due date and priority from raw input */
export function parseSmartInput(raw: string): ParsedInput {
  let title = raw.trim();
  let priority = 3;
  let due_date: string | null = null;

  // Priority detection
  if (/\b(urgent|critical|p1)\b/i.test(title)) {
    priority = 1;
    title = title.replace(/\b(urgent|critical|p1)\b/gi, '').trim();
  } else if (/\b(high|important|p2)\b/i.test(title)) {
    priority = 2;
    title = title.replace(/\b(high|important|p2)\b/gi, '').trim();
  } else if (/\b(low|p4)\b/i.test(title)) {
    priority = 4;
    title = title.replace(/\b(low|p4)\b/gi, '').trim();
  }

  // Date detection
  const today = new Date();
  if (/\btoday\b/i.test(title)) {
    due_date = getLocalDateString(today);
    title = title.replace(/\btoday\b/gi, '').trim();
  } else if (/\btomorrow\b/i.test(title)) {
    due_date = getLocalDateString(addDays(today, 1));
    title = title.replace(/\btomorrow\b/gi, '').trim();
  } else if (/\bnext week\b/i.test(title)) {
    due_date = getLocalDateString(addDays(today, 7));
    title = title.replace(/\bnext week\b/gi, '').trim();
  }

  // Clean extra spaces
  title = title.replace(/\s{2,}/g, ' ').trim();

  return { title, priority, due_date };
}

export function usePersonalTodos(employeeId?: string) {
  const qc = useQueryClient();
  const key = ['personal-todos', employeeId];

  const { data: todos = [], isPending } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await (supabase as any)
        .from('personal_todos')
        .select('*')
        .eq('employee_id', employeeId)
        .is('deleted_at', null)
        .order('is_completed', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PersonalTodo[];
    },
    enabled: !!employeeId,
  });

  const createTodo = useMutation({
    mutationFn: async (input: { title: string; priority?: number; due_date?: string | null; tenant_id: string }) => {
      const { data, error } = await (supabase as any)
        .from('personal_todos')
        .insert({
          employee_id: employeeId!,
          tenant_id: input.tenant_id,
          title: input.title,
          priority: input.priority ?? 3,
          due_date: input.due_date ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Failed to create todo'),
  });

  const toggleComplete = useMutation({
    mutationFn: async (todoId: string) => {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;
      const nowCompleted = !todo.is_completed;
      const { error } = await (supabase as any)
        .from('personal_todos')
        .update({
          is_completed: nowCompleted,
          completed_at: nowCompleted ? new Date().toISOString() : null,
        })
        .eq('id', todoId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (todoId: string) => {
      const { error } = await (supabase as any)
        .from('personal_todos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', todoId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Failed to delete todo'),
  });

  const updateTodo = useMutation({
    mutationFn: async (input: { id: string; title?: string; priority?: number; due_date?: string | null }) => {
      const { id, ...updates } = input;
      const { error } = await (supabase as any)
        .from('personal_todos')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { todos, isPending, createTodo, toggleComplete, deleteTodo, updateTodo };
}
