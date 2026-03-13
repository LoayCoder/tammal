# TAMMAL — Product Specification Document

> **Version**: 1.0.0  
> **Last Updated**: 2026-03-13  
> **Published URL**: [tammal.lovable.app](https://tammal.lovable.app)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Architecture](#2-product-architecture)
3. [Feature Domains](#3-feature-domains)
   - 3.1 [Authentication & Authorization](#31-authentication--authorization)
   - 3.2 [Dashboards](#32-dashboards)
   - 3.3 [Employee Engagement](#33-employee-engagement)
   - 3.4 [Survey & Question Management](#34-survey--question-management)
   - 3.5 [Mental Wellness Toolkit](#35-mental-wellness-toolkit)
   - 3.6 [Spiritual Wellness](#36-spiritual-wellness)
   - 3.7 [Task & Workload Management](#37-task--workload-management)
   - 3.8 [Recognition & Awards](#38-recognition--awards)
   - 3.9 [Crisis Support](#39-crisis-support)
   - 3.10 [Organization Administration](#310-organization-administration)
4. [AI Architecture](#4-ai-architecture)
5. [Data Model](#5-data-model)
6. [Security Model](#6-security-model)
7. [Internationalization](#7-internationalization)
8. [PWA & Branding](#8-pwa--branding)
9. [Design System](#9-design-system)
10. [Monitoring & Observability](#10-monitoring--observability)

---

## 1. Executive Summary

TAMMAL is a **multi-tenant, bilingual (Arabic/English) SaaS platform** for employee wellbeing, engagement, task management, and recognition. It targets organizations in MENA markets with culturally-sensitive features including spiritual wellness tools (prayer tracking, Quran reading, Sunnah habits) alongside standard enterprise HR capabilities.

### Target Market
- Enterprise and mid-market organizations in the MENA region
- HR departments seeking integrated employee wellness solutions
- Organizations requiring Arabic-first, RTL-native tooling

### Core Value Proposition
- Unified employee experience platform combining wellness, tasks, recognition, and crisis support
- Culturally-aware spiritual wellness features (Islamic practices)
- AI-powered question generation, insights, and workload intelligence
- Enterprise-grade multi-tenant architecture with per-tenant branding

---

## 2. Product Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + Shadcn/UI (Radix primitives) |
| State Management | TanStack React Query v5 |
| Routing | React Router v6 |
| Backend | Lovable Cloud (Supabase) |
| AI Providers | Google Gemini (primary) + OpenAI (fallback) |
| Error Monitoring | Sentry |
| i18n | i18next + react-i18next |
| PWA | vite-plugin-pwa |
| Testing | Vitest + Testing Library |
| Forms | React Hook Form + Zod |

### Key Architectural Decisions

- **Multi-tenant isolation** via `tenant_id` on all tables with Row-Level Security (RLS)
- **Role-based access control**: Super Admin, Tenant Admin, Manager, Employee, First Aider, Representative
- **i18n with RTL support**: Arabic (primary) + English, automatic direction switching
- **PWA-installable** with dynamic branding per tenant (logos, colors, favicon, manifest)
- **Lazy-loaded routes** (~69 pages) with ErrorBoundary coverage
- **AI-powered features** via dual-provider routing (Gemini/OpenAI) with full governance layer
- **Soft-delete standard**: All destructive operations use `deleted_at` timestamp, never hard DELETE
- **Audit logging**: Critical mutations logged to `audit_logs` table
- **Feature gating**: Premium modules check active subscription before rendering

### Architecture Priority Order

```
Security → Tenant Isolation → Compliance → RTL Integrity → Performance → UX
```

---

## 3. Feature Domains

The platform is organized into **10 domains** spanning approximately **69 routable pages**.

### 3.1 Authentication & Authorization

| Feature | Description |
|---|---|
| Email/Password Auth | Standard signup + login (no anonymous signups) |
| Invitation Onboarding | Accept-invite flow (`/auth/accept-invite`) |
| Route Guards | `ProtectedRoute`, `AdminRoute`, `ManagerOrAdminRoute` |
| Permission Gate | Component-level permission checks (`PermissionGate`) |
| Security Settings | MFA trust duration, session timeout, max concurrent sessions, glass-break mode |

**Role Hierarchy**:
```
Super Admin → Tenant Admin → Manager → Employee
                                     → First Aider
                                     → Representative
```

**Security Settings** (configurable per tenant):
- `mfa_trust_duration_days`: 15 (default)
- `session_timeout_minutes`: 15 (default)
- `max_concurrent_sessions`: 1 (default)
- `glass_break_active`: false (default)

### 3.2 Dashboards

| Dashboard | Audience | Key Features |
|---|---|---|
| Employee Home | All employees | Personal wellness overview, daily check-in prompt |
| Org Dashboard | Admins/Managers | Stat cards, trend data, distribution charts, AI insights, workload indicators; tabs: Overview, Deep Analysis, Alerts, Comparison |
| Executive Dashboard | C-level | Portfolio-level view with time-range and org-unit filtering |

### 3.3 Employee Engagement

| Feature | Description |
|---|---|
| Daily Check-in | Wellness mood capture with guided questions |
| Employee Survey | Scheduled surveys with question categories/subcategories |
| Mood Tracker | Longitudinal mood tracking with configurable chart colors |
| Mood Pathway Settings | Admin-configured mood-based intervention pathways |
| Check-in Monitor | Admin dashboard for check-in completion rates |
| Survey Monitor | Admin dashboard for survey response analytics |

### 3.4 Survey & Question Management

**Admin-only module** for managing the question bank and AI generation.

| Feature | Description |
|---|---|
| Question CRUD | Create, edit, archive questions |
| Question Types | `likert_5`, `numeric_scale`, `yes_no`, `open_ended`, `multiple_choice` |
| Category Hierarchy | Categories → Subcategories for question organization |
| AI Question Generator | Generates questions with configurable settings |
| Schedule Engine | Batch scheduling for question delivery |
| Knowledge Documents | Upload documents for AI context enrichment |

**AI Generation Settings** (defaults):
```typescript
{
  questionCount: 5,
  complexity: 'moderate',      // simple | moderate | advanced
  tone: 'neutral',             // formal | casual | neutral
  language: 'both',            // ar | en | both
  requireExplanation: true,
  enableBiasDetection: true,
  enableAmbiguityDetection: true,
  enableDuplicateDetection: true,
  enableCriticPass: false,
  minWordLength: 5,
}
```

### 3.5 Mental Wellness Toolkit

Eight integrated wellness tools accessible to all employees:

| Tool | Description | Backend |
|---|---|---|
| Mood Tracker | Daily mood logging with trend visualization | `mood_entries` table |
| Thought Reframer | AI-assisted cognitive reframing | `suggest-reframe` edge function |
| Breathing Exercises | Guided sessions (box, 4-7-8, etc.) with completion tracking | `breathing_sessions` table |
| Journaling | Private reflective writing entries | `journal_entries` table |
| Meditation | Guided meditation sessions with duration tracking | `meditation_sessions` table |
| Habit Tracker | Daily habit formation and streak tracking | `habits` table |
| Articles | Curated wellness content library | `articles` table |
| Self-Assessment | Mental health self-evaluation questionnaires | `self_assessments` table |

### 3.6 Spiritual Wellness

**MENA-specific module** — fully configurable per user.

| Feature | Description | Backend |
|---|---|---|
| Prayer Tracker | 5 daily prayer logging with geolocation-based prayer times | `prayer_logs` table |
| Quran Reader | Audio player + text reader with progress tracking (ayah, juz, surah) | `quran_sessions` table |
| Sunnah Tracker | Daily Sunnah practice logging | `sunnah_logs` table |
| Spiritual Insights | AI-generated weekly/monthly insight reports | `generate-spiritual-insights` edge function |
| Islamic Calendar | Hijri calendar with Islamic events | Client-side computation |
| Fasting Tracker | Ramadan and voluntary fasting logs | `fasting_logs` table |

**User Preferences** (`spiritual_preferences` table):
- `enabled`: Master toggle
- `prayer_enabled`, `quran_enabled`, `fasting_enabled`: Feature toggles
- `reminders_enabled`, `reminder_intensity`: Notification settings
- `city`, `country`, `latitude`, `longitude`, `calculation_method`: Prayer time calculation

### 3.7 Task & Workload Management

Enterprise-grade task management with AI-powered workload intelligence.

#### Task Management

| Feature | Description |
|---|---|
| Personal Command Center | Employee task view with approvals, time tracking |
| Task Detail | Full lifecycle: checklists, comments, activity timeline, dependencies, attachments, tags, members, AI panel |
| Create Task Modal | Task creation with template support |
| Recurring Tasks | Automated recurrence via `create-recurring-tasks` edge function |
| Overdue Tasks | Manager/admin visibility into overdue items |
| Manager Task Overview | Team task status aggregation |
| Task Performance Analytics | Velocity, completion rates, bottleneck metrics |
| Task Templates | Reusable task blueprints |
| Approval Queue | Multi-step approval workflows |

#### Workload Management

| Feature | Description |
|---|---|
| Workload Dashboard | Org-wide heatmaps, capacity planning |
| Team Workload | Per-team task distribution |
| Representative Workload | Rep-specific task allocation |
| Portfolio Dashboard | Strategic initiative tracking |
| Executive Dashboard | C-level workload summary |
| Capacity Planning | Per-employee capacity configuration (daily/weekly minutes, max concurrent actions) |

#### Advanced Features

| Feature | Description |
|---|---|
| Objectives & Key Results | OKR management with action sub-tasks |
| Task Connectors | External system integrations |
| Escalation Settings | SLA monitoring, deadline checks, escalation rules |
| System Health | Platform operational status |

#### AI Workload Intelligence

| Capability | Description |
|---|---|
| Delay Predictions | AI-predicted task delays |
| Redistribution Suggestions | Workload balancing recommendations |
| Burnout Predictions | Employee burnout risk scoring |
| SLA Monitor | Service-level agreement tracking |
| Analytics Snapshots | Periodic workload summaries |

### 3.8 Recognition & Awards

Multi-phase award lifecycle with fairness engine.

#### Award Cycle Phases

```
Nomination → Peer Endorsement → Voting → Audit Review → Announcement
```

| Feature | Description |
|---|---|
| Cycle Builder | Wizard: basics, themes, fairness settings, review steps |
| Nomination | Submit nominations with theme selection |
| Peer Endorsement | Endorse colleagues' nominations |
| Voting Booth | Cast votes during voting phase |
| Nomination Approvals | Manager approval workflow |
| Recognition Results | Winner calculation via edge function |
| Recognition Monitor | Real-time cycle health dashboard |

#### Fairness Engine

| Mechanism | Description |
|---|---|
| Clique Detection | Identifies voting cliques/collusion |
| Demographic Parity | Targets equitable representation |
| Visibility Bias Correction | Adjusts for role/location visibility imbalances |
| Voting Weight Limits | Caps individual voting influence |
| Appeals Process | Formal challenge mechanism |

#### Points & Rewards

| Feature | Description |
|---|---|
| Points Dashboard | View earned recognition points |
| Redemption Catalog | Browse and redeem points for rewards |
| Redemption Management | Admin catalog and fulfillment management |

### 3.9 Crisis Support

| Feature | Audience | Description |
|---|---|---|
| Crisis Request | Employee | Submit crisis/support request |
| My Support | Employee | Track personal support request history |
| First Aider Dashboard | First Aider | Manage incoming cases (auto-matched via `match-first-aider` edge function) |
| Crisis Settings | Admin | Configure crisis protocols, first aider assignments |

### 3.10 Organization Administration

| Feature | Description |
|---|---|
| Tenant Management | Multi-tenant CRUD (Super Admin) |
| Org Structure | Divisions → Departments → Branches hierarchy |
| User Management | Unified employee CRUD with statuses: `not_invited`, `invited`, `active`, `suspended`, `inactive` |
| Branding | Per-tenant logos (general, light, dark, icon), HSL colors (primary, secondary, accent), dynamic favicon & PWA manifest |
| Plan Management | Subscription plan configuration |
| Subscription Management | Tenant plan assignment |
| Usage & Billing | Consumption tracking and quota enforcement |
| Document Settings | Organizational document/template management |
| Audit Logs | Full audit trail for critical actions |

#### AI Governance (Admin)

| Feature | Description |
|---|---|
| Strategy Switching | Thompson Sampling for provider selection |
| Posterior Resets | Reset learning parameters |
| Provider Penalties | Temporary provider demotion on failures |
| Budget Management | Per-tenant cost/token limits |
| Cost Dashboard | Daily aggregation and forecasting |
| Performance Dashboard | Latency, success rate, error rate tracking |
| Sandbox Evaluations | A/B test new models before production |
| Autonomous Optimizer | Self-tuning with anomaly detection |

---

## 4. AI Architecture

### Dual-Provider Routing

| Primary Provider | Fallback Provider |
|---|---|
| Google Gemini | OpenAI |

**Default Model**: `google/gemini-3-flash-preview`

**Cross-Provider Fallback Map**:

| Primary Model | Fallback Model |
|---|---|
| `google/gemini-3-flash-preview` | `openai/gpt-5-mini` |
| `google/gemini-3-pro-preview` | `openai/gpt-5` |
| `google/gemini-2.5-flash` | `openai/gpt-5-mini` |
| `google/gemini-2.5-flash-lite` | `openai/gpt-5-nano` |
| `google/gemini-2.5-pro` | `openai/gpt-5` |
| `openai/gpt-5` | `google/gemini-2.5-pro` |
| `openai/gpt-5-mini` | `google/gemini-2.5-flash` |
| `openai/gpt-5-nano` | `google/gemini-2.5-flash-lite` |

### Governance Layer

| Mechanism | Details |
|---|---|
| Provider Selection | Thompson Sampling with EWMA metrics |
| Autonomous Optimizer | Anomaly detection, hyperparameter tuning, weight adjustment |
| Sandbox Evaluations | Traffic splitting for model A/B testing |
| Cost Tracking | Daily aggregation, burn-rate forecasting |
| Rate Limiting | 30 req/user, 200 req/tenant per 10-min window |
| Budget Alerts | Configurable threshold warnings (default 80%) |
| Audit Trail | Full governance action logging |
| Plan-Based Limits | Monthly token/cost limits per subscription plan |

### Configuration Constants

```typescript
AI_TIMEOUT_MS          = 120,000     // 2 minutes per call
AI_MAX_RETRIES         = 1           // One fallback attempt
MAX_CONTEXT_CHARS      = 200,000     // ~50k tokens
MAX_CUSTOM_PROMPT_CHARS = 2,000
MAX_DOCUMENT_CONTEXT   = 32,000
MAX_FRAMEWORK_CONTEXT  = 32,000
RATE_LIMIT_PER_USER    = 30
RATE_LIMIT_PER_TENANT  = 200
RATE_LIMIT_WINDOW      = 10 minutes
```

### Edge Functions (~36)

| Category | Functions |
|---|---|
| Question Generation | `generate-questions` (with limit resolver, rate limiter, cost tracking) |
| Wellness | `suggest-reframe` |
| Spiritual | `generate-spiritual-insights` |
| Tasks | `create-recurring-tasks`, task AI engine |
| Workload | Delay predictions, redistribution, burnout predictions, SLA monitor |
| Recognition | Winner calculation |
| Crisis | `match-first-aider` |
| Documents | `parse-document` |
| Escalation | Deadline checks, SLA monitoring |

---

## 5. Data Model

### Overview

The database contains **80+ tables** organized into the following groups:

### Table Groups

#### Organization (5 core tables)

| Table | Description |
|---|---|
| `tenants` | Root tenant entity |
| `divisions` | Top-level org units |
| `departments` | Department hierarchy (supports parent-child nesting) |
| `branches` | Physical locations |
| `employees` | All users with org assignment (linked to `auth.users` via `user_id`) |

#### Survey & Questions (6 tables)

| Table | Description |
|---|---|
| `wellness_questions` | Question bank |
| `question_categories` | Category definitions |
| `question_subcategories` | Subcategory definitions |
| `scheduled_questions` | Delivery schedule |
| `daily_question_schedule` | Daily question rotation |
| `employee_responses` | Response data |

#### AI Infrastructure (18+ tables)

| Table | Description |
|---|---|
| `ai_models` | Registered AI models |
| `ai_generation_logs` | Generation attempt logs |
| `ai_provider_events` | Per-call telemetry |
| `ai_provider_metrics_agg` | Aggregated provider metrics (EWMA) |
| `ai_cost_daily_agg` | Daily cost aggregation |
| `ai_forecast_state` | Cost forecasting |
| `ai_rate_limits` | Per-user/tenant rate tracking |
| `ai_tenant_limits` | Tenant-specific limit overrides |
| `ai_plan_limits` | Plan-based default limits |
| `ai_tenant_plan` | Tenant → plan mapping |
| `ai_usage_alerts` | Budget threshold alerts |
| `ai_cost_alerts` | Cost alerts |
| `ai_pending_requests` | Human-in-the-loop queue |
| `ai_sandbox_evaluations` | Model A/B tests |
| `ai_provider_penalties` | Temporary provider demotions |
| `ai_provider_usage_24h` | Rolling 24h usage |
| `ai_autonomous_state` | Optimizer state |
| `ai_autonomous_audit_log` | Optimizer action log |
| `ai_governance_audit_log` | Admin governance actions |
| `ai_knowledge_documents` | Uploaded context documents |
| `ai_performance_daily_agg` | Daily performance aggregation |

#### Tasks & Workload (15+ tables)

| Table | Description |
|---|---|
| `tasks` | Core task entity |
| `task_checklists` | Sub-item checklists |
| `task_comments` | Discussion threads |
| `task_activity` | Activity timeline |
| `task_attachments` | File attachments |
| `task_tags` | Tag assignments |
| `task_members` | Team member assignments |
| `task_time_entries` | Time tracking |
| `task_dependencies` | Dependency graph |
| `task_templates` | Reusable blueprints |
| `recurring_tasks` | Recurrence definitions |
| `employee_capacity` | Per-employee capacity config |
| `burnout_predictions` | AI burnout risk scores |
| `action_sub_tasks` | OKR action items |
| `approvals` / `approval_flows` | Approval workflows |

#### Recognition (10+ tables)

| Table | Description |
|---|---|
| `award_cycles` | Cycle definitions with phase dates |
| `award_themes` | Theme definitions per cycle |
| `nominations` | Nomination submissions |
| `endorsement_requests` | Peer endorsement tracking |
| `votes` | Voting records |
| `theme_results` | Calculated results per theme |
| `appeals` | Formal challenge submissions |
| `recognition_points` | Point balances |
| `redemption_catalog` | Reward items |
| `redemptions` | Redemption transactions |

#### Wellness (5+ tables)

| Table | Description |
|---|---|
| `breathing_sessions` | Breathing exercise records |
| `mood_entries` | Mood log entries |
| `habits` | Habit definitions and streaks |
| `journal_entries` | Private journal entries |
| `meditation_sessions` | Meditation records |

#### Spiritual (5+ tables)

| Table | Description |
|---|---|
| `prayer_logs` | Daily prayer completion |
| `quran_sessions` | Quran reading sessions |
| `sunnah_logs` | Sunnah practice records |
| `spiritual_preferences` | Per-user spiritual settings |
| `spiritual_insight_reports` | AI-generated insight reports |

#### System (5+ tables)

| Table | Description |
|---|---|
| `audit_logs` | Audit trail |
| `tenant_branding` | Per-tenant visual identity |
| `user_roles` | Role assignments (separate from profiles) |
| `sites` | Organizational sites/sections |
| `mood_definitions` | Configurable mood types |

---

## 6. Security Model

### Tenant Isolation

- **Every table** includes `tenant_id UUID NOT NULL`
- **RLS enabled** on all tenant-scoped tables
- **Server-side tenant resolution** via JWT `app_metadata`
- **No client-side tenant filtering** — all isolation enforced at database level

### Role-Based Access Control

```sql
-- Roles stored in dedicated table (never on profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Security definer function prevents recursive RLS
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Soft Delete Standard

- **Hard DELETE operations are forbidden**
- All tables use `deleted_at TIMESTAMP NULL`
- All SELECT queries include `WHERE deleted_at IS NULL`

### Session Management

| Setting | Default | Configurable |
|---|---|---|
| MFA Trust Duration | 15 days | Yes |
| Session Timeout | 15 minutes | Yes |
| Max Concurrent Sessions | 1 | Yes |
| Glass-Break Mode | Disabled | Yes (emergency access) |

### Audit Logging

Critical modules with mandatory audit logging:
- Subscriptions & Plans
- Billing
- User Roles
- Organization Structure
- Feature Flags
- Branding
- Support Tickets

---

## 7. Internationalization

### Language Support

| Language | Direction | Priority |
|---|---|---|
| Arabic (ar) | RTL | Primary |
| English (en) | LTR | Secondary |

### Implementation

- **Framework**: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Locale Files**: `src/locales/ar.json`, `src/locales/en.json`
- **Direction Switching**: Automatic `dir` attribute on `<html>` element

### RTL Protocol (Strictly Enforced)

**Forbidden** CSS classes:
```
ml-, mr-, pl-, pr-, left-, right-, text-left, text-right
```

**Required** logical equivalents:
```
ms-, me-, ps-, pe-, text-start, text-end
```

**Additional RTL rules**:
- No direction-based ternaries (`isRTL ? 'mr-2' : 'ml-2'`)
- All portal components (Dialog, Select, Dropdown, Popover) inherit `dir` from root
- Directional icons use `rtl:-scale-x-100` or `rtl:rotate-180`

---

## 8. PWA & Branding

### Progressive Web App

- **Plugin**: `vite-plugin-pwa`
- **Install Prompt**: Custom banner for mobile/desktop installation
- **Offline Support**: Service worker with cache strategy
- **Mobile Navigation**: Bottom tab bar on small viewports

### Dynamic Branding

| Asset | Variants | Storage |
|---|---|---|
| Logo | General, Light, Dark, Icon | `tenant_branding` table + storage bucket |
| Colors | Primary, Secondary, Accent (HSL) | CSS custom properties injected at runtime |
| Favicon | Dynamic from tenant icon | Generated at layout load |
| PWA Manifest | Dynamic name, icons, theme color | Generated from branding data |

**Brand Injection Protocol**:
1. Fetch `tenant_branding` at layout load
2. Inject CSS variables (`--primary`, `--secondary`, `--accent`)
3. Apply before rendering UI
4. No runtime flicker allowed

---

## 9. Design System

### Version: 1.0.0

| Category | Count |
|---|---|
| UI Primitives (Radix-based) | 50 |
| System Components | 6 |
| Layout Components | 6 |
| Shared Patterns | 6 |
| Form Components | 25+ |
| Dialogs/Modals | 35+ |

### Theme

- **Style**: Glass-morphism with CSS custom properties
- **Color System**: HSL-based semantic tokens
- **Chart Colors**: Branded overrides via `MOOD_CHART_COLORS`

### Protected Paths

These directories are architecturally protected and require careful review before modification:

```
src/components/system/
src/components/ui/
src/theme/
src/styles/
```

### Semantic Tokens

```css
:root {
  --background: /* HSL */;
  --foreground: /* HSL */;
  --primary: /* HSL */;
  --primary-foreground: /* HSL */;
  --secondary: /* HSL */;
  --muted: /* HSL */;
  --accent: /* HSL */;
  --destructive: /* HSL */;
  --border: /* HSL */;
  --ring: /* HSL */;
}
```

---

## 10. Monitoring & Observability

### Error Tracking

- **Provider**: Sentry (`@sentry/react`)
- **Coverage**: Global error boundary + per-route boundaries

### AI Telemetry

Every AI call logs:
- Feature name
- Prompt ID & version
- Provider & model used
- Duration (ms)
- Success/failure
- Fallback usage
- Tokens consumed
- Estimated cost

### Audit Systems

| System | Purpose |
|---|---|
| `audit_logs` | Admin action trail |
| `ai_governance_audit_log` | AI governance decisions |
| `ai_autonomous_audit_log` | Autonomous optimizer actions |
| `ai_provider_events` | Per-call provider telemetry |
| `ai_generation_logs` | Question generation attempts |

---

## Appendix A: Page Inventory (~69 pages)

### Auth (3)
- `/auth` — Login/Signup
- `/auth/accept-invite` — Invitation acceptance
- `/auth/verify-otp` — OTP verification

### Employee (8)
- `/` — Employee Home
- `/check-in` — Daily Check-in
- `/employee-survey` — Survey participation
- `/mood-tracker` — Personal mood tracking
- `/my-tasks` — Personal Command Center
- `/task/:id` — Task Detail
- `/points` — Recognition Points
- `/my-support` — Crisis support history

### Mental Toolkit (8)
- `/mental-toolkit` — Hub
- `/mental-toolkit/mood` — Mood Tracker
- `/mental-toolkit/reframe` — Thought Reframer
- `/mental-toolkit/breathing` — Breathing Exercises
- `/mental-toolkit/journal` — Journaling
- `/mental-toolkit/meditation` — Meditation
- `/mental-toolkit/habits` — Habit Tracker
- `/mental-toolkit/articles` — Wellness Articles
- `/mental-toolkit/assessment` — Self-Assessment

### Spiritual (6)
- `/spiritual` — Hub
- `/spiritual/prayer` — Prayer Tracker
- `/spiritual/quran` — Quran Reader
- `/spiritual/sunnah` — Sunnah Tracker
- `/spiritual/insights` — Spiritual Insights
- `/spiritual/calendar` — Islamic Calendar

### Recognition (8)
- `/recognition` — Hub
- `/recognition/nominate` — Submit Nomination
- `/recognition/endorse` — Peer Endorsement
- `/recognition/vote` — Voting Booth
- `/recognition/results` — Results
- `/recognition/monitor` — Cycle Monitor
- `/recognition/redeem` — Redemption Catalog

### Crisis (3)
- `/crisis/request` — Submit Request
- `/crisis/first-aider` — First Aider Dashboard
- `/crisis/my-support` — Personal History

### Admin (20+)
- `/admin/dashboard` — Org Dashboard
- `/admin/executive-dashboard` — Executive View
- `/admin/users` — User Management
- `/admin/org-structure` — Org Structure
- `/admin/branding` — Branding
- `/admin/questions` — Question Management
- `/admin/categories` — Category Management
- `/admin/schedule` — Schedule Management
- `/admin/survey-monitor` — Survey Monitor
- `/admin/checkin-monitor` — Check-in Monitor
- `/admin/mood-settings` — Mood Settings
- `/admin/recognition/*` — Recognition Admin (cycles, builder, approvals, redemptions)
- `/admin/workload/*` — Workload Admin (dashboard, team, representative, portfolio, executive, connectors, escalation, health)
- `/admin/ai-governance` — AI Governance
- `/admin/crisis-settings` — Crisis Settings
- `/admin/plans` — Plan Management
- `/admin/subscriptions` — Subscription Management
- `/admin/billing` — Usage & Billing
- `/admin/audit-logs` — Audit Logs
- `/admin/documents` — Document Settings

### Settings (3)
- `/settings` — User Settings Hub
- `/settings/spiritual` — Spiritual Preferences
- `/settings/notifications` — Notification Preferences

### Dev (1)
- `/dev/showcase` — Component Showcase

---

## Appendix B: Scalability Targets

| Metric | Target |
|---|---|
| Tenants | 10,000+ |
| Users | 100,000+ |
| Concurrent Dashboard Access | Supported |
| Database Queries | Indexed `tenant_id` + FKs, no N+1 |
| Large Datasets | Paginated (default 1,000 row limit) |

---

## Appendix C: File Structure Overview

```
src/
├── components/          # ~250 components
│   ├── ui/              # 50 Radix-based primitives (PROTECTED)
│   ├── system/          # 6 system components (PROTECTED)
│   ├── layout/          # 6 layout components
│   ├── auth/            # Route guards, permission gates
│   ├── dashboard/       # Dashboard widgets
│   └── [domain]/        # Domain-specific components
├── features/            # Feature modules (barrel exports)
│   ├── tasks/           # Enterprise task management
│   ├── workload/        # Workload intelligence
│   └── recognition/     # Awards & recognition
├── hooks/               # Custom hooks by domain
│   ├── auth/            # Authentication hooks
│   ├── questions/       # Question management
│   ├── spiritual/       # Spiritual feature hooks
│   └── [domain]/        # Domain-specific hooks
├── pages/               # ~69 route pages
│   ├── admin/           # Admin pages
│   ├── employee/        # Employee pages
│   ├── mental-toolkit/  # Wellness tools
│   ├── spiritual/       # Spiritual features
│   ├── recognition/     # Recognition pages
│   ├── crisis/          # Crisis support
│   ├── settings/        # Settings pages
│   └── dev/             # Developer tools
├── config/              # Configuration constants
│   ├── ai.ts            # AI provider config
│   ├── constants.ts     # Shared constants
│   ├── moods.ts         # Mood definitions
│   └── pagination.ts    # Pagination config
├── integrations/        # External integrations
│   └── supabase/        # Auto-generated types + client (DO NOT EDIT)
├── locales/             # i18n translations
│   ├── ar.json          # Arabic
│   └── en.json          # English
├── types/               # TypeScript type definitions
└── lib/                 # Utility libraries

supabase/
├── functions/           # ~36 edge functions
│   ├── generate-questions/
│   ├── suggest-reframe/
│   ├── generate-spiritual-insights/
│   ├── create-recurring-tasks/
│   ├── match-first-aider/
│   └── [others]/
├── migrations/          # Database migrations (READ-ONLY)
└── config.toml          # Supabase config (AUTO-GENERATED)

docs/
└── PRODUCT_SPEC.md      # This document
```

---

*End of Product Specification Document*
