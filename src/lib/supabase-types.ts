/**
 * Supabase type helpers — provides strongly-typed shortcuts
 * derived from the auto-generated Database type.
 *
 * Usage:
 *   import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase-types';
 *   type Mood = TableRow<'mood_definitions'>;
 */
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

/** Row type for a given table name */
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];

/** Insert type for a given table name */
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];

/** Update type for a given table name */
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];
