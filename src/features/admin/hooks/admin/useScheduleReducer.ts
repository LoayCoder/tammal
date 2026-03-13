/**
 * useScheduleReducer — centralises all form + dialog state for ScheduleManagement.
 * Extracted from ScheduleManagement.tsx with ZERO behaviour change.
 */

import { useReducer, useCallback } from 'react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';

// ── State shape ──────────────────────────────────────────────────────────────

export interface ScheduleFormState {
  // Dialog control
  dialogOpen: boolean;
  editingSchedule: QuestionSchedule | null;
  deleteId: string | null;
  audienceViewSchedule: QuestionSchedule | null;
  audienceSearch: string;

  // Form fields
  name: string;
  description: string;
  frequency: string;
  preferredTime: string;
  questionsPerDelivery: number;
  weekendDays: number[];
  selectedBatchIds: string[];
  audienceType: 'all' | 'departments' | 'specific';
  selectedDepartments: string[];
  selectedEmployees: string[];
  employeeSearch: string;
  scheduleType: 'daily_checkin' | 'survey';
  startDate: string;
  endDate: string;
  linkedPeriodId: string | null;
  moodOverrides: Record<string, { enabled: boolean; value: number }>;
  moodConfigOpen: boolean;
}

const INITIAL_STATE: ScheduleFormState = {
  dialogOpen: false,
  editingSchedule: null,
  deleteId: null,
  audienceViewSchedule: null,
  audienceSearch: '',

  name: '',
  description: '',
  frequency: '1_per_day',
  preferredTime: '09:00',
  questionsPerDelivery: 1,
  weekendDays: [5, 6],
  selectedBatchIds: [],
  audienceType: 'all',
  selectedDepartments: [],
  selectedEmployees: [],
  employeeSearch: '',
  scheduleType: 'daily_checkin',
  startDate: '',
  endDate: '',
  linkedPeriodId: null,
  moodOverrides: {},
  moodConfigOpen: false,
};

// ── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_FIELD'; field: keyof ScheduleFormState; value: any }
  | { type: 'RESET_FORM' }
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; schedule: QuestionSchedule; moodConfigs: any[] }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_DELETE_ID'; id: string | null }
  | { type: 'SET_AUDIENCE_VIEW'; schedule: QuestionSchedule | null }
  | { type: 'CHANGE_SCHEDULE_TYPE'; scheduleType: 'daily_checkin' | 'survey' }
  | { type: 'SET_MOOD_OVERRIDE'; key: string; enabled: boolean; value: number }
  | { type: 'CLAMP_MOOD_OVERRIDES'; maxValue: number };

function reducer(state: ScheduleFormState, action: Action): ScheduleFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'RESET_FORM':
      return {
        ...state,
        ...INITIAL_STATE,
        // Keep dialog-level booleans controlled separately
        dialogOpen: false,
        deleteId: null,
        audienceViewSchedule: null,
      };

    case 'OPEN_CREATE':
      return { ...INITIAL_STATE, dialogOpen: true };

    case 'OPEN_EDIT': {
      const s = action.schedule;
      const ta = s.target_audience;
      let audienceType: 'all' | 'departments' | 'specific' = 'all';
      let selectedDepartments: string[] = [];
      let selectedEmployees: string[] = [];

      if (ta?.departments && ta.departments.length > 0) {
        audienceType = 'departments';
        selectedDepartments = ta.departments;
      } else if (ta?.specific_employees && ta.specific_employees.length > 0) {
        audienceType = 'specific';
        selectedEmployees = ta.specific_employees;
      }

      const overrides: Record<string, { enabled: boolean; value: number }> = {};
      for (const cfg of action.moodConfigs) {
        if ((cfg as any).is_custom_override) {
          overrides[cfg.mood_level] = { enabled: true, value: cfg.max_questions };
        }
      }

      return {
        ...state,
        dialogOpen: true,
        editingSchedule: s,
        name: s.name,
        description: s.description || '',
        frequency: s.frequency,
        preferredTime: s.preferred_time || '09:00',
        questionsPerDelivery: s.questions_per_delivery || 1,
        weekendDays: (s as any).weekend_days || (s.avoid_weekends ? [5, 6] : []),
        selectedBatchIds: s.batch_ids || [],
        audienceType,
        selectedDepartments,
        selectedEmployees,
        employeeSearch: '',
        scheduleType: s.schedule_type || 'daily_checkin',
        startDate: s.start_date || '',
        endDate: s.end_date || '',
        linkedPeriodId: s.generation_period_id || null,
        moodOverrides: overrides,
        moodConfigOpen: Object.keys(overrides).length > 0,
      };
    }

    case 'CLOSE_DIALOG':
      return { ...INITIAL_STATE, dialogOpen: false };

    case 'SET_DELETE_ID':
      return { ...state, deleteId: action.id };

    case 'SET_AUDIENCE_VIEW':
      return { ...state, audienceViewSchedule: action.schedule, audienceSearch: '' };

    case 'CHANGE_SCHEDULE_TYPE':
      return {
        ...state,
        scheduleType: action.scheduleType,
        selectedBatchIds: [],
        linkedPeriodId: null,
        startDate: '',
        endDate: '',
      };

    case 'SET_MOOD_OVERRIDE':
      return {
        ...state,
        moodOverrides: {
          ...state.moodOverrides,
          [action.key]: { enabled: action.enabled, value: action.value },
        },
      };

    case 'CLAMP_MOOD_OVERRIDES': {
      const updated = { ...state.moodOverrides };
      for (const key of Object.keys(updated)) {
        if (updated[key].enabled && updated[key].value > action.maxValue) {
          updated[key] = { ...updated[key], value: action.maxValue };
        }
      }
      return { ...state, moodOverrides: updated };
    }

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useScheduleReducer() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setField = useCallback(
    <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) =>
      dispatch({ type: 'SET_FIELD', field, value }),
    [],
  );

  return { state, dispatch, setField };
}
