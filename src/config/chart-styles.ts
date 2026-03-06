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

/** Glass-style tooltip container */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(var(--primary) / 0.1)',
};

/** Legend wrapper */
export const CHART_LEGEND_STYLE: React.CSSProperties = {
  fontSize: 11,
};

/** Common CartesianGrid props */
export const CHART_GRID_STROKE = 'hsl(var(--border))';
