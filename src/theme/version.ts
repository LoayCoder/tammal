/**
 * Design System Version & Metadata
 * ─────────────────────────────────
 * Single source of truth for version tracking, protected paths,
 * and governance metadata. Referenced in /dev/design-system.
 */

export const DESIGN_SYSTEM = {
  version: '1.5.0',
  lastUpdated: '2026-04-04',
  description:
    'Core SaaS design system with tokens, system components, dashboard architecture, UI governance framework, semantic state colors, action/rank/prayer/trend/KPI/severity/islamic-accent/system-role color tokens, interactive color editor.',
  protectedPaths: [
    'src/components/system',
    'src/components/ui',
    'src/theme',
    'src/styles',
  ],
} as const;
