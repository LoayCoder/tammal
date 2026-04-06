import { useEffect, useRef, useCallback } from 'react';
import { usePushNotifications } from '@/hooks/ui/usePushNotifications';
import type { PersonalTodo } from './usePersonalTodos';

/**
 * Polls personal todos every 60s and fires push notifications
 * when current time reaches (due_datetime - reminder_offset).
 * Also notifies for overdue tasks.
 */
export function useTodoReminders(
  todos: PersonalTodo[],
  updateTodo: (input: { id: string; reminder_sent?: boolean }) => void,
) {
  const { isGranted, sendServiceWorkerNotification, sendNotification } = usePushNotifications();
  const sentRef = useRef<Set<string>>(new Set());

  const notify = useCallback(
    (title: string, body: string) => {
      // Try SW notification first (works in background), fallback to Notification API
      sendServiceWorkerNotification(title, { body, tag: 'todo-reminder' }).catch(() => {
        sendNotification(title, { body, tag: 'todo-reminder' });
      });
    },
    [sendServiceWorkerNotification, sendNotification],
  );

  const check = useCallback(() => {
    if (!isGranted) return;
    const now = new Date();

    for (const todo of todos) {
      if (todo.is_completed || sentRef.current.has(todo.id)) continue;

      if (!todo.due_date) continue;

      // Build due datetime
      const [y, m, d] = todo.due_date.split('-').map(Number);
      let hours = 23, minutes = 59;
      if (todo.due_time) {
        const parts = todo.due_time.split(':').map(Number);
        hours = parts[0];
        minutes = parts[1] ?? 0;
      }
      const dueDate = new Date(y, m - 1, d, hours, minutes);

      // Check reminder
      if (todo.reminder_offset != null && !todo.reminder_sent) {
        const reminderTime = new Date(dueDate.getTime() - todo.reminder_offset * 60_000);
        if (now >= reminderTime && now < dueDate) {
          sentRef.current.add(todo.id);
          notify(
            '⏰ Task Reminder',
            `"${todo.title}" is due ${todo.reminder_offset >= 60
              ? `in ${Math.round(todo.reminder_offset / 60)} hour(s)`
              : `in ${todo.reminder_offset} min`
            }`,
          );
          updateTodo({ id: todo.id, reminder_sent: true });
        }
      }

      // Check overdue
      if (now > dueDate) {
        const overdueKey = `overdue-${todo.id}`;
        if (!sentRef.current.has(overdueKey)) {
          sentRef.current.add(overdueKey);
          notify('🔴 Overdue Task', `"${todo.title}" is past due!`);
        }
      }
    }
  }, [todos, isGranted, notify, updateTodo]);

  useEffect(() => {
    check(); // immediate check
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [check]);
}
