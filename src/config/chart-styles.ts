/**
 * Shared chart typography & style constants.
 * Use these for all Recharts components to ensure consistent sizing.
 */

/** Standard tick style for XAxis / YAxis */
export const CHART_AXIS_TICK = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground))',
} as const;

/** Smaller axis label (rotated labels, secondary axes) */
export const CHART_AXIS_LABEL = {
  fontSize: 10,
  fill: 'hsl(var(--muted-foreground))',
} as const;

/** Clean solid tooltip container */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
  boxShadow: '0 4px 12px hsl(220 40% 50% / 0.08)',
};

/** Legend wrapper */
export const CHART_LEGEND_STYLE: React.CSSProperties = {
  fontSize: 11,
};

/** Common CartesianGrid props */
export const CHART_GRID_STROKE = 'hsl(var(--border))';
