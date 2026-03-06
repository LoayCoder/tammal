/**
 * Enterprise Task Management feature barrel.
 * All external consumers should import from this module.
 */

// Hooks
export { useEnterpriseTasks } from './hooks/useEnterpriseTasks';
export { useTaskAI } from './hooks/useTaskAI';
export { useTaskActivity } from './hooks/useTaskActivity';
export { useTaskAttachments } from './hooks/useTaskAttachments';
export { useTaskChecklists } from './hooks/useTaskChecklists';
export { useTaskComments } from './hooks/useTaskComments';
export { useTaskDependencies } from './hooks/useTaskDependencies';
export { useTaskMembers } from './hooks/useTaskMembers';
export { useTaskNotifications } from './hooks/useTaskNotifications';
export { useTaskTags } from './hooks/useTaskTags';
export { useTaskTemplates } from './hooks/useTaskTemplates';
export { useTaskTimeTracking } from './hooks/useTaskTimeTracking';
export { useApprovalQueue } from './hooks/useApprovalQueue';
export { useTaskDetail, useTaskUpdate } from './hooks/useTaskDetail';
export { useOverdueTasks } from './hooks/useOverdueTasks';
export { useManagerTaskOverview } from './hooks/useManagerTaskOverview';
export { useRecurringTasks } from './hooks/useRecurringTasks';
export { useTaskPerformanceAnalytics } from './hooks/useTaskPerformanceAnalytics';

// Components
export { CreateTaskModal } from './components/CreateTaskModal';
export { NotificationBell } from './components/NotificationBell';
export { TaskAIPanel } from './components/TaskAIPanel';
export { TaskActivityTimeline } from './components/TaskActivityTimeline';
export { TaskCommentsPanel } from './components/TaskCommentsPanel';
export { TaskDependenciesPanel } from './components/TaskDependenciesPanel';
export { TaskTimeTrackingPanel } from './components/TaskTimeTrackingPanel';
