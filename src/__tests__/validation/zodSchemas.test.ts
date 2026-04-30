/**
 * Schema validation tests — schemas extracted/mirrored from component files.
 * Testing both valid payloads (should pass) and invalid payloads (should surface error messages).
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. InviteUserDialog — src/components/users/InviteUserDialog.tsx:44-51
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  fullName: z.string().trim().max(120, 'Full name is too long').optional().or(z.literal('')),
  phoneNumber: z.string().trim().max(30, 'Phone number is too long').optional().or(z.literal('')),
  expiryDays: z.coerce.number().int().min(1, 'Expiry must be at least 1 day').max(30, 'Expiry cannot exceed 30 days'),
});

describe('InviteUserDialog schema', () => {
  it('accepts valid invite', () => {
    const result = inviteSchema.safeParse({ email: 'user@example.com', expiryDays: 7 });
    expect(result.success).toBe(true);
  });
  it('rejects invalid email', () => {
    const result = inviteSchema.safeParse({ email: 'not-an-email', expiryDays: 7 });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain('Please enter a valid email address');
  });
  it('rejects expiryDays = 0', () => {
    const result = inviteSchema.safeParse({ email: 'user@example.com', expiryDays: 0 });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain('Expiry must be at least 1 day');
  });
  it('rejects expiryDays > 30', () => {
    const result = inviteSchema.safeParse({ email: 'user@example.com', expiryDays: 31 });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain('Expiry cannot exceed 30 days');
  });
  it('rejects fullName over 120 chars', () => {
    const result = inviteSchema.safeParse({
      email: 'user@example.com',
      expiryDays: 7,
      fullName: 'A'.repeat(121),
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain('Full name is too long');
  });
});

// ---------------------------------------------------------------------------
// 2. CategoryDialog — src/components/questions/CategoryDialog.tsx:55-63
// ---------------------------------------------------------------------------
const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  color: z.string().trim().min(4, 'Color is required'),
  icon: z.string().trim().min(1, 'Icon is required'),
  weight: z.number().min(0, 'Weight must be at least 0').max(10, 'Weight must be at most 10'),
  isActive: z.boolean(),
});

describe('CategoryDialog schema', () => {
  const valid = { name: 'Health', color: '#fff', icon: 'heart', weight: 5, isActive: true };

  it('accepts valid category', () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
  });
  it('rejects name shorter than 2 chars', () => {
    const r = categorySchema.safeParse({ ...valid, name: 'A' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Category name is required');
  });
  it('rejects missing color', () => {
    const r = categorySchema.safeParse({ ...valid, color: 'ab' }); // shorter than 4
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Color is required');
  });
  it('rejects weight above 10', () => {
    const r = categorySchema.safeParse({ ...valid, weight: 11 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Weight must be at most 10');
  });
  it('rejects negative weight', () => {
    const r = categorySchema.safeParse({ ...valid, weight: -1 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Weight must be at least 0');
  });
});

// ---------------------------------------------------------------------------
// 3. SubcategoryDialog — src/components/questions/SubcategoryDialog.tsx:41-48
// ---------------------------------------------------------------------------
const subcategorySchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().trim().min(2, 'Subcategory name is required'),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  weight: z.number().min(0, 'Weight must be at least 0').max(10, 'Weight must be at most 10'),
  isActive: z.boolean(),
});

describe('SubcategoryDialog schema', () => {
  const valid = { categoryId: 'cat-1', name: 'Stress', weight: 3, isActive: true };

  it('accepts valid subcategory', () => {
    expect(subcategorySchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty categoryId', () => {
    const r = subcategorySchema.safeParse({ ...valid, categoryId: '' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Category is required');
  });
  it('rejects name with 1 char', () => {
    const r = subcategorySchema.safeParse({ ...valid, name: 'X' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Subcategory name is required');
  });
});

// ---------------------------------------------------------------------------
// 4. QuestionDialog — src/components/questions/QuestionDialog.tsx:47-58
// ---------------------------------------------------------------------------
const questionSchema = z
  .object({
    text: z.string().trim().min(5, 'Question text is required'),
    textAr: z.string().optional(),
    type: z.enum(['likert_5', 'likert_7', 'binary', 'multiple_choice', 'numeric', 'text']),
    categoryId: z.string().min(1, 'Category is required'),
    options: z.array(z.string()).optional(),
    moodLevels: z.array(z.string()),
    isActive: z.boolean(),
    isGlobal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'multiple_choice' && (!data.options || data.options.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'At least two options are required for multiple choice questions',
      });
    }
  });

describe('QuestionDialog schema', () => {
  const valid = {
    text: 'How are you today?',
    type: 'likert_5' as const,
    categoryId: 'cat-1',
    moodLevels: [],
    isActive: true,
    isGlobal: false,
  };

  it('accepts valid question', () => {
    expect(questionSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects text under 5 chars', () => {
    const r = questionSchema.safeParse({ ...valid, text: 'Hi?' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Question text is required');
  });
  it('rejects unknown type', () => {
    const r = questionSchema.safeParse({ ...valid, type: 'unknown' });
    expect(r.success).toBe(false);
  });
  it('rejects multiple_choice with 0 options', () => {
    const r = questionSchema.safeParse({ ...valid, type: 'multiple_choice', options: [] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('At least two options');
  });
  it('accepts multiple_choice with 2 options', () => {
    const r = questionSchema.safeParse({
      ...valid,
      type: 'multiple_choice',
      options: ['Yes', 'No'],
    });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. DeleteTaskDialog — src/components/workload/representative/DeleteTaskDialog.tsx:23-25
// ---------------------------------------------------------------------------
const deleteTaskSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  justification: z.string().trim().min(3, 'Justification must be at least 3 characters'),
});

describe('DeleteTaskDialog schema', () => {
  it('accepts valid payload', () => {
    expect(deleteTaskSchema.safeParse({ taskId: 'task-1', justification: 'Bug' }).success).toBe(true);
  });
  it('rejects empty taskId', () => {
    const r = deleteTaskSchema.safeParse({ taskId: '', justification: 'Bug' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Task is required');
  });
  it('rejects short justification', () => {
    const r = deleteTaskSchema.safeParse({ taskId: 'task-1', justification: 'AB' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Justification must be at least 3 characters');
  });
});

// ---------------------------------------------------------------------------
// 6. EditTaskDialog — src/components/workload/representative/EditTaskDialog.tsx:38-45
// ---------------------------------------------------------------------------
const editTaskSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  title: z.string().trim().min(2, 'Title is required'),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  priority: z.coerce.number().int().min(1, 'Priority must be between 1 and 5').max(5, 'Priority must be between 1 and 5'),
  estimatedMinutes: z.union([
    z.string().length(0),
    z.coerce.number().int().min(1, 'Estimated minutes must be at least 1'),
  ]),
  justification: z.string().trim().min(3, 'Justification must be at least 3 characters'),
});

describe('EditTaskDialog schema', () => {
  const valid = { taskId: 't1', title: 'Fix bug', priority: 3, estimatedMinutes: 30, justification: 'Urgent fix' };

  it('accepts valid payload', () => {
    expect(editTaskSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects priority 0', () => {
    const r = editTaskSchema.safeParse({ ...valid, priority: 0 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Priority must be between 1 and 5');
  });
  it('rejects priority 6', () => {
    const r = editTaskSchema.safeParse({ ...valid, priority: 6 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Priority must be between 1 and 5');
  });
  it('rejects title of 1 char', () => {
    const r = editTaskSchema.safeParse({ ...valid, title: 'X' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Title is required');
  });
  it('accepts empty string for estimatedMinutes', () => {
    const r = editTaskSchema.safeParse({ ...valid, estimatedMinutes: '' });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. ExtendDueDateDialog — src/components/workload/representative/ExtendDueDateDialog.tsx:36-39
// ---------------------------------------------------------------------------
const extendDueDateSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  newDueDate: z.string().min(1, 'New due date is required'),
  justification: z.string().trim().min(3, 'Justification must be at least 3 characters'),
});

describe('ExtendDueDateDialog schema', () => {
  it('accepts valid payload', () => {
    expect(extendDueDateSchema.safeParse({ taskId: 't1', newDueDate: '2025-12-01', justification: 'More time needed' }).success).toBe(true);
  });
  it('rejects empty newDueDate', () => {
    const r = extendDueDateSchema.safeParse({ taskId: 't1', newDueDate: '', justification: 'reason' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('New due date is required');
  });
  it('rejects justification of 2 chars', () => {
    const r = extendDueDateSchema.safeParse({ taskId: 't1', newDueDate: '2025-12-01', justification: 'AB' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Justification must be at least 3 characters');
  });
});

// ---------------------------------------------------------------------------
// 8. EmergencyContactsTab — src/components/crisis/EmergencyContactsTab.tsx:28-33
// ---------------------------------------------------------------------------
const emergencyContactSchema = z.object({
  title: z.string().trim().min(2, 'Contact title is required'),
  phone: z.string().trim().min(4, 'Phone number is required').max(30, 'Phone number is too long'),
  description: z.string().optional(),
  available_24_7: z.boolean(),
  country: z.string().min(2, 'Country is required'),
});

describe('EmergencyContactsTab schema', () => {
  const valid = { title: 'Emergency Line', phone: '0800', available_24_7: true, country: 'SA' };

  it('accepts valid contact', () => {
    expect(emergencyContactSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects title of 1 char', () => {
    const r = emergencyContactSchema.safeParse({ ...valid, title: 'X' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Contact title is required');
  });
  it('rejects short phone', () => {
    const r = emergencyContactSchema.safeParse({ ...valid, phone: '080' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Phone number is required');
  });
  it('rejects phone over 30 chars', () => {
    const r = emergencyContactSchema.safeParse({ ...valid, phone: '1'.repeat(31) });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Phone number is too long');
  });
  it('rejects country of 1 char', () => {
    const r = emergencyContactSchema.safeParse({ ...valid, country: 'X' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Country is required');
  });
});

// ---------------------------------------------------------------------------
// 9. FirstAidersTab — src/components/crisis/FirstAidersTab.tsx:39-46
// ---------------------------------------------------------------------------
const firstAiderSchema = z.object({
  user_id: z.string().optional(),
  display_name: z.string().trim().min(2, 'Display name is required'),
  department: z.string().optional(),
  role_title: z.string().optional(),
  bio: z.string().optional(),
  max_active_cases: z.coerce.number().int().min(1, 'Must allow at least 1 case').max(20, 'Cannot exceed 20 active cases'),
  allow_anonymous_requests: z.boolean(),
});

describe('FirstAidersTab schema', () => {
  const valid = { display_name: 'Alice Smith', max_active_cases: 5, allow_anonymous_requests: true };

  it('accepts valid first aider', () => {
    expect(firstAiderSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects display_name of 1 char', () => {
    const r = firstAiderSchema.safeParse({ ...valid, display_name: 'A' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Display name is required');
  });
  it('rejects max_active_cases = 0', () => {
    const r = firstAiderSchema.safeParse({ ...valid, max_active_cases: 0 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Must allow at least 1 case');
  });
  it('rejects max_active_cases > 20', () => {
    const r = firstAiderSchema.safeParse({ ...valid, max_active_cases: 21 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Cannot exceed 20 active cases');
  });
});

// ---------------------------------------------------------------------------
// 10. SchedulesTab — src/components/crisis/SchedulesTab.tsx:34-36
// ---------------------------------------------------------------------------
const scheduleSchema = z.object({
  selectedFA: z.string().min(1, 'Please select a first aider'),
  sla: z.coerce.number().int().min(5, 'SLA must be at least 5 minutes').max(480, 'SLA cannot exceed 480 minutes'),
});

describe('SchedulesTab schema', () => {
  it('accepts valid schedule', () => {
    expect(scheduleSchema.safeParse({ selectedFA: 'fa-1', sla: 60 }).success).toBe(true);
  });
  it('rejects empty selectedFA', () => {
    const r = scheduleSchema.safeParse({ selectedFA: '', sla: 60 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('Please select a first aider');
  });
  it('rejects sla below 5', () => {
    const r = scheduleSchema.safeParse({ selectedFA: 'fa-1', sla: 4 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('SLA must be at least 5 minutes');
  });
  it('rejects sla above 480', () => {
    const r = scheduleSchema.safeParse({ selectedFA: 'fa-1', sla: 481 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('SLA cannot exceed 480 minutes');
  });
  it('accepts boundary sla = 5', () => {
    expect(scheduleSchema.safeParse({ selectedFA: 'fa-1', sla: 5 }).success).toBe(true);
  });
  it('accepts boundary sla = 480', () => {
    expect(scheduleSchema.safeParse({ selectedFA: 'fa-1', sla: 480 }).success).toBe(true);
  });
});
