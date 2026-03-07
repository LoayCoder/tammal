/**
 * Design System Version & Metadata
 * ─────────────────────────────────
 * Single source of truth for version tracking, protected paths,
 * and governance metadata. Referenced in /dev/design-system.
 */

export const DESIGN_SYSTEM = {
  version: '1.0.0',
  lastUpdated: '2026-03-07',
  description:
    'Core SaaS design system with tokens, system components, dashboard architecture, and UI governance framework.',
  protectedPaths: [
    'src/components/system',
    'src/components/ui',
    'src/theme',
    'src/styles',
  ],
} as const;
