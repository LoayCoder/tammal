/**
 * Canonical mood definitions — single source of truth.
 * DB (mood_definitions table) is primary; these are fallback defaults only.
 */

/** Mood level keys used across the platform */
export const MOOD_KEYS = ['great', 'good', 'okay', 'struggling', 'need_help'] as const;
export type MoodKey = (typeof MOOD_KEYS)[number];

/** Fallback mood metadata when DB definitions are unavailable */
export const DEFAULT_MOOD_META: readonly {
  key: MoodKey;
  score: number;
  emoji: string;
  labelKey: string;
  labelAr: string;
}[] = [
  { key: 'great', score: 5, emoji: '😄', labelKey: 'checkin.moodGreat', labelAr: 'ممتاز' },
  { key: 'good', score: 4, emoji: '🙂', labelKey: 'checkin.moodGood', labelAr: 'جيد' },
  { key: 'okay', score: 3, emoji: '😐', labelKey: 'checkin.moodOkay', labelAr: 'عادي' },
  { key: 'struggling', score: 2, emoji: '😟', labelKey: 'checkin.moodStruggling', labelAr: 'أعاني' },
  { key: 'need_help', score: 1, emoji: '😞', labelKey: 'checkin.moodNeedHelp', labelAr: 'بحاجة للمساعدة' },
] as const;

/** Tailwind color mapping for dynamic mood colors (used in MoodStep) */
export const MOOD_COLOR_STYLES: Record<string, {
  bgFrom: string; bgTo: string; border: string;
  activeBorder: string; ring: string; text: string;
}> = {
  'text-chart-1': { bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-600/10', border: 'border-emerald-500/40', activeBorder: 'border-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-500' },
  'text-chart-2': { bgFrom: 'from-blue-500/20', bgTo: 'to-blue-600/10', border: 'border-blue-500/40', activeBorder: 'border-blue-500', ring: 'ring-blue-500/30', text: 'text-blue-500' },
  'text-chart-3': { bgFrom: 'from-purple-500/20', bgTo: 'to-purple-600/10', border: 'border-purple-500/40', activeBorder: 'border-purple-500', ring: 'ring-purple-500/30', text: 'text-purple-500' },
  'text-chart-4': { bgFrom: 'from-yellow-500/20', bgTo: 'to-yellow-600/10', border: 'border-yellow-500/40', activeBorder: 'border-yellow-500', ring: 'ring-yellow-500/30', text: 'text-yellow-500' },
  'text-chart-5': { bgFrom: 'from-pink-500/20', bgTo: 'to-pink-600/10', border: 'border-pink-500/40', activeBorder: 'border-pink-500', ring: 'ring-pink-500/30', text: 'text-pink-500' },
  'text-destructive': { bgFrom: 'from-red-500/20', bgTo: 'to-red-600/10', border: 'border-red-500/40', activeBorder: 'border-red-500', ring: 'ring-red-500/30', text: 'text-red-500' },
  'text-primary': { bgFrom: 'from-primary/20', bgTo: 'to-primary/10', border: 'border-primary/40', activeBorder: 'border-primary', ring: 'ring-primary/30', text: 'text-primary' },
  'text-muted-foreground': { bgFrom: 'from-gray-500/20', bgTo: 'to-gray-600/10', border: 'border-gray-500/40', activeBorder: 'border-gray-500', ring: 'ring-gray-500/30', text: 'text-gray-500' },
};

/** Default fallback style when color key not found */
export const DEFAULT_MOOD_COLOR_STYLE = MOOD_COLOR_STYLES['text-chart-4'];

/** Static fallback mood list for MoodStep (legacy) */
export const FALLBACK_MOODS = [
  { level: 'great', score: 5, emoji: '😄', bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-600/10', border: 'border-emerald-500/40', activeBorder: 'border-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-500' },
  { level: 'good', score: 4, emoji: '🙂', bgFrom: 'from-green-500/20', bgTo: 'to-green-600/10', border: 'border-green-500/40', activeBorder: 'border-green-500', ring: 'ring-green-500/30', text: 'text-green-500' },
  { level: 'okay', score: 3, emoji: '😐', bgFrom: 'from-yellow-500/20', bgTo: 'to-yellow-600/10', border: 'border-yellow-500/40', activeBorder: 'border-yellow-500', ring: 'ring-yellow-500/30', text: 'text-yellow-500' },
  { level: 'struggling', score: 2, emoji: '😟', bgFrom: 'from-orange-500/20', bgTo: 'to-orange-600/10', border: 'border-orange-500/40', activeBorder: 'border-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-500' },
  { level: 'need_help', score: 1, emoji: '😢', bgFrom: 'from-red-500/20', bgTo: 'to-red-600/10', border: 'border-red-500/40', activeBorder: 'border-red-500', ring: 'ring-red-500/30', text: 'text-red-500' },
] as const;

/** Chart colors keyed by mood level (for recharts / dashboard components) */
export const MOOD_CHART_COLORS: Record<MoodKey, string> = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive) / 0.7)',
  need_help: 'hsl(var(--destructive))',
};

/** Helper to resolve a mood color style from a color key */
export function getMoodStyle(color: string) {
  return MOOD_COLOR_STYLES[color] || DEFAULT_MOOD_COLOR_STYLE;
}
