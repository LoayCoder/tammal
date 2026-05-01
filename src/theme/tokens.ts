/**
 * Tammal Design System — Enterprise-grade tokens
 * Dark-first, modern SaaS aesthetic inspired by Linear, Vercel, Retool
 */

// ── Color Tokens ─────────────────────────────────────────────────────
// These map to CSS variables defined in index.css
export const colors = {
  // Backgrounds
  canvas: 'var(--bg-canvas)',
  subtle: 'var(--bg-subtle)',
  surface: 'var(--bg-surface)',
  surfaceElevated: 'var(--bg-surface-elevated)',
  surfaceGlass: 'var(--bg-surface-glass)',
  surfaceHover: 'var(--bg-surface-hover)',
  inverse: 'var(--bg-inverse)',

  // Text
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textMuted: 'var(--text-muted)',
  textInverse: 'var(--text-inverse)',

  // Borders
  borderSubtle: 'var(--border-subtle)',
  borderDefault: 'var(--border-default)',
  borderStrong: 'var(--border-strong)',
  borderFocus: 'var(--border-focus)',

  // Brand
  brandPrimary: 'var(--brand-primary)',
  brandPrimaryHover: 'var(--brand-primary-hover)',
  brandPrimaryActive: 'var(--brand-primary-active)',
  brandPrimarySoft: 'var(--brand-primary-soft)',
  brandSecondary: 'var(--brand-secondary)',
  brandSecondarySoft: 'var(--brand-secondary-soft)',

  // Semantic
  success: 'var(--success)',
  successSoft: 'var(--success-soft)',
  warning: 'var(--warning)',
  warningSoft: 'var(--warning-soft)',
  danger: 'var(--danger)',
  dangerSoft: 'var(--danger-soft)',
  info: 'var(--info)',
  infoSoft: 'var(--info-soft)',
} as const;

export const chartSeries = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
  tertiary: 'var(--chart-3)',
  warning: 'var(--chart-4)',
  danger: 'var(--chart-5)',
  success: 'var(--chart-6)',
  accent: 'var(--chart-7)',
  accentSoft: 'var(--chart-8)',
} as const;

// ── Spacing ──────────────────────────────────────────────────────────
export const spacing = {
  cardCompact: 'p-5',
  cardStandard: 'p-6',
  cardElevated: 'p-6',
  cardInteractive: 'p-5', // Legacy support
  emptyState: 'py-16',
  pageShell: 'px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6',
  pageSection: 'space-y-8',
  widgetGap: 'gap-4 xl:gap-5',
  formSection: 'space-y-6',
  // Legacy support
  pageWrapper: 'px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6',
  sectionGap: 'space-y-8',
  gridGap: 'gap-4',
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const typography = {
  displayLg: 'text-[40px] leading-[48px] font-bold tracking-[-0.02em]',
  displayMd: 'text-[32px] leading-[40px] font-bold tracking-[-0.02em]',
  h1: 'text-[28px] leading-[36px] font-bold tracking-[-0.02em]',
  h2: 'text-2xl leading-8 font-bold tracking-[-0.02em]',
  h3: 'text-xl leading-7 font-semibold tracking-[-0.01em]',
  h4: 'text-lg leading-[26px] font-semibold tracking-[-0.01em]',
  title: 'text-base leading-6 font-semibold',
  bodyLg: 'text-base leading-[26px] font-medium',
  body: 'text-sm leading-[22px] font-medium',
  bodySm: 'text-[13px] leading-5 font-medium',
  caption: 'text-xs leading-[18px] font-medium',
  label: 'text-xs leading-4 font-semibold',
  monoData: 'text-xs leading-[18px] font-semibold font-mono tabular-nums',

  // Page-specific
  pageTitle: 'text-[28px] leading-[36px] font-bold tracking-[-0.02em] text-[var(--text-primary)]',
  pageSubtitle: 'text-sm text-[var(--text-secondary)] leading-[22px]',
  sectionTitle: 'text-xl leading-7 font-semibold tracking-[-0.01em] text-[var(--text-primary)]',
  cardTitle: 'text-base leading-6 font-semibold text-[var(--text-primary)]',
  metric: 'text-[32px] leading-[40px] font-bold tracking-[-0.02em] tabular-nums text-[var(--text-primary)]',
  statLabel: 'text-[11px] leading-4 font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]',
  
  // Legacy support
  subtitle: 'text-sm text-[var(--text-secondary)] leading-[22px]',
  greeting: 'text-2xl md:text-3xl font-bold tracking-[-0.02em] text-[var(--text-primary)]',
  vipName: 'text-[var(--brand-primary)] font-extrabold',
} as const;

// ── Card Variants ────────────────────────────────────────────────────
export const cardVariants = {
  surface: 'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]',
  elevated: 'rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-[var(--shadow-sm)]',
  glass: 'rounded-2xl border border-white/10 bg-[var(--bg-surface-glass)] backdrop-blur-xl',
  interactive: 'transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]',
  // Legacy support
  stat: 'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]',
  premium: 'rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-[var(--shadow-sm)]',
  premiumVip: 'rounded-2xl border border-[rgba(20,184,166,0.18)] bg-[var(--bg-surface-elevated)] shadow-[var(--shadow-md)]',
  dashed: 'rounded-2xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-surface)]',
} as const;

// ── Layout ───────────────────────────────────────────────────────────
export const layout = {
  pageMaxWidth: 'max-w-[1600px]',
  formMaxWidth: 'max-w-[1200px]',
  narrowMaxWidth: 'max-w-3xl',
  statGrid2: 'grid gap-4 grid-cols-1 sm:grid-cols-2',
  statGrid3: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  statGrid4: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  statGrid6: 'grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  dashboardGrid: 'grid gap-4 xl:gap-5 grid-cols-1 xl:grid-cols-12',
  twoColLayout: 'grid gap-6 lg:grid-cols-3',
  twoColPrimary: 'lg:col-span-2',
  twoColSecondary: 'lg:col-span-1',
  // Legacy support
  contentMaxWidth: 'max-w-4xl mx-auto',
} as const;

// ── Iconography ──────────────────────────────────────────────────────
export const iconBox = {
  sm: 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
  md: 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
  lg: 'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
} as const;

// ── Radius ───────────────────────────────────────────────────────────
export const radius = {
  xs: 'rounded-lg',    // 8px
  sm: 'rounded-[10px]', // 10px
  md: 'rounded-xl',    // 12px
  lg: 'rounded-2xl',   // 16px
  xl: 'rounded-3xl',   // 20px
  pill: 'rounded-full',
} as const;

// ── Shadow tokens ────────────────────────────────────────────────────
export const shadow = {
  xs: 'shadow-[var(--shadow-xs)]',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
  lg: 'shadow-[var(--shadow-lg)]',
  focus: 'shadow-[var(--shadow-focus)]',
} as const;
