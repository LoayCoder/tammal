

# Product Specification Document — TAMMAL

I'll create a comprehensive `docs/PRODUCT_SPEC.md` file at the project root. Here's the full document:

---

## Document Structure

### 1. Executive Summary
TAMMAL is a multi-tenant, bilingual (Arabic/English) SaaS platform for employee wellbeing, engagement, task management, and recognition. It targets organizations in MENA markets with culturally-sensitive features including spiritual wellness tools (prayer tracking, Quran reading, Sunnah habits) alongside standard enterprise HR capabilities.

**Published URL**: tammal.lovable.app

### 2. Product Architecture

**Tech Stack**: React 18 + Vite + TypeScript + Tailwind CSS + Lovable Cloud (backend)

**Key Architectural Decisions**:
- Multi-tenant isolation via `tenant_id` on all tables
- Role-based access (Admin, Manager, Employee, First Aider, Representative)
- i18n with RTL support (Arabic/English)
- PWA-installable with dynamic branding per tenant
- Lazy-loaded routes (~69 pages) with ErrorBoundary coverage
- AI-powered features via dual-provider routing (Gemini/OpenAI) with governance layer
- Sentry error monitoring
- Design system v1.0.0 with protected component paths

### 3. Feature Domains (10 domains, ~69 pages)

#### 3.1 Authentication & Authorization
- Email/password signup + login (no anonymous signups)
- Invitation-based onboarding (`/auth/accept-invite`)
- Role-based route guards: `ProtectedRoute`, `AdminRoute`, `ManagerOrAdminRoute`
- Security settings: MFA trust duration, session timeout, max concurrent sessions, glass-break mode

#### 3.2 Dashboards (3 views)
- **Employee Home**: Personal wellness overview
- **Org Dashboard**: Analytics with stat cards, trend data, distribution charts, AI insights, workload indicators; tabs for Overview, Deep Analysis, Alerts, Comparison
- **Executive Dashboard**: Portfolio-level view with time-range and org filtering

#### 3.3 Employee Engagement
- **Daily Check-in**: Wellness mood capture with guided questions
- **Employee Survey**: Scheduled surveys with question categories/subcategories
- **Mood Tracker**: Longitudinal mood tracking with chart colors and pathway settings
- **Mood Pathway Settings** (admin): Configure mood-based interventions

#### 3.4 Survey & Question Management (Admin)
- Question CRUD with types: likert_5, numeric_scale, yes_no, open_ended, multiple_choice
- Category & subcategory hierarchy
- AI Question Generator: generates questions with bias detection, ambiguity detection, duplicate detection, critic pass
- Schedule engine for question delivery (batch scheduling)
- Survey Monitor & Check-in Monitor dashboards
- Knowledge document upload for AI context

#### 3.5 Mental Wellness Toolkit (8 tools)
| Tool | Description |
|---|---|
| Mood Tracker | Daily mood logging with trend visualization |
| Thought Reframer | AI-assisted cognitive reframing (suggest-reframe edge function) |
| Breathing Exercises | Guided sessions with completion tracking |
| Journaling | Private reflective writing |
| Meditation | Guided meditation sessions |
| Habit Tracker | Daily habit formation |
| Articles | Curated wellness content |
| Self-Assessment | Mental health self-evaluation |

#### 3.6 Spiritual Wellness (6 features, MENA-specific)
| Feature | Description |
|---|---|
| Prayer Tracker | 5 daily prayer logging with geolocation-based times |
| Quran Reader | Audio player + text reader with progress tracking (ayahs, juz, surah) |
| Sunnah Tracker | Daily Sunnah practice logging |
| Spiritual Insights | AI-generated insights (generate-spiritual-insights edge function) |
| Islamic Calendar | Hijri calendar with events |
| Configurable per user | Enable/disable prayer, quran, fasting, reminders |

#### 3.7 Task & Workload Management (Enterprise)
- **Personal Command Center**: Employee task view with approvals, time tracking
- **Task Detail**: Full task lifecycle — checklists, comments, activity timeline, dependencies, attachments, tags, members, AI panel
- **Create Task Modal**: Task creation with templates
- **Recurring Tasks**: Automated task recurrence (create-recurring-tasks edge function)
- **Overdue Tasks**: Manager/admin visibility into overdue items
- **Manager Task Overview**: Team task status
- **Task Performance Analytics**: Velocity, completion metrics
- **Task Templates**: Reusable task blueprints
- **Workload Dashboard** (admin): Org-wide workload heatmaps, capacity planning
- **Team Workload**: Per-team distribution
- **Representative Workload**: Task distribution for reps
- **Portfolio Dashboard**: Strategic initiative tracking
- **Executive Dashboard**: C-level workload summary
- **Task Connectors**: External system integrations
- **Objectives & Key Results**: OKR management with action sub-tasks
- **Escalation Settings**: SLA monitoring, deadline checks, escalation rules
- **System Health**: Platform operational status
- **AI Features**: Task AI engine, workload intelligence (delay predictions, redistribution suggestions, burnout predictions, SLA monitor, analytics snapshots)

#### 3.8 Recognition & Awards
- **Award Cycles**: Multi-phase lifecycle (nomination → peer endorsement → voting → audit → announcement)
- **Cycle Builder**: Wizard with basics, themes, fairness settings, review steps
- **Fairness Engine**: Clique detection, demographic parity targets, visibility bias correction, voting weight adjustment limits, appeals
- **Nomination**: Submit nominations with theme selection
- **Peer Endorsement**: Endorse colleagues' nominations
- **Voting Booth**: Cast votes during voting phase
- **Nomination Approvals**: Manager approval workflow
- **Recognition Results**: Winner calculation (edge function)
- **Recognition Monitor**: Real-time cycle health dashboard
- **Points Dashboard**: Earned recognition points
- **Redemption Catalog**: Redeem points for rewards
- **Redemption Management** (admin): Manage reward catalog and fulfillment

#### 3.9 Crisis Support
- **Crisis Request**: Employee submits crisis/support request
- **My Support**: Track personal support requests
- **First Aider Dashboard**: Assigned first aiders manage incoming cases (match-first-aider edge function)
- **Crisis Settings** (admin): Configure crisis protocols

#### 3.10 Organization Administration
- **Tenant Management**: Multi-tenant CRUD
- **Org Structure**: Divisions → Departments → Branches hierarchy
- **User Management**: Unified employee CRUD with account statuses (not_invited, invited, active, suspended, inactive)
- **Branding**: Per-tenant logos (general, light, dark, icon variants), primary/secondary/accent colors, dynamic favicon & PWA manifest
- **Plan Management**: Subscription plan configuration
- **Subscription Management**: Tenant plan assignment
- **Usage & Billing**: Consumption tracking
- **Document Settings**: Organizational document management
- **Audit Logs**: Full audit trail
- **AI Governance**: Strategy switching (Thompson Sampling), posterior resets, provider penalties, budget management, cost/performance dashboards, sandbox evaluations, autonomous optimizer

### 4. AI Architecture

**Dual-Provider Routing**: Gemini (primary) ↔ OpenAI (fallback) with automatic cross-provider fallback map.

**Governance Layer**:
- Thompson Sampling strategy for provider selection
- Autonomous optimizer with anomaly detection and hyperparameter tuning
- Sandbox evaluations before production deployment
- Cost daily aggregation and forecasting with burn-rate tracking
- Rate limiting: 30 req/user, 200 req/tenant per 10-min window
- Budget alerts and usage tracking per tenant plan
- Full audit log for all governance actions

**36 Edge Functions** covering: question generation, wellness insights, spiritual insights, thought reframing, document parsing, task AI, workload intelligence, recognition results, escalation checks, SLA monitoring, and more.

### 5. Data Model (~80+ tables)

Key table groups:
- **Org**: tenants, divisions, departments, branches, employees
- **Survey**: questions, categories, subcategories, schedules, responses
- **AI**: models, generation_logs, governance audit, cost/performance aggs, rate limits, sandbox evaluations, provider metrics, penalties, forecasts
- **Tasks**: tasks, checklists, comments, activity, attachments, tags, members, time tracking, dependencies, templates, approvals, recurring tasks
- **Workload**: capacity, burnout predictions, escalation events, strategic alignment, heatmaps, redistribution
- **Recognition**: award_cycles, themes, nominations, endorsements, votes, appeals, points, redemptions
- **Wellness**: breathing_sessions, mood entries, habits, journals, meditation sessions
- **Spiritual**: prayer_logs, quran_sessions, sunnah_logs, spiritual_preferences
- **Crisis**: crisis_requests, first_aider assignments
- **System**: audit_logs, branding, user_roles, approval_flows

### 6. Security Model
- Row-Level Security (RLS) on all tables
- Roles stored in separate `user_roles` table (never on profiles)
- `has_role()` SECURITY DEFINER function to prevent recursive RLS
- Tenant isolation via `tenant_id` foreign keys
- Session management with configurable timeouts
- Glass-break emergency access mode

### 7. Internationalization
- Full Arabic/English support with `i18next` + browser language detection
- RTL layout support (automatic `dir` attribute switching)
- Locale files: `src/locales/ar.json`, `src/locales/en.json`

### 8. PWA & Branding
- Installable PWA with `vite-plugin-pwa`
- Dynamic manifest generation from tenant branding
- Dynamic favicon from tenant logo
- Install prompt banner
- Mobile bottom navigation
- Responsive glassmorphism design system with decorative gradient blobs

### 9. Design System (v1.0.0)
- 50 UI primitives (Radix-based)
- 6 system components (protected path)
- 6 layout components
- Glass-morphism theme with CSS custom properties
- Chart color system with branded overrides
- Protected paths: `src/components/system`, `src/components/ui`, `src/theme`, `src/styles`

### 10. Monitoring & Observability
- Sentry integration for error tracking
- AI telemetry context on every AI call (feature, prompt ID, version, provider, model, duration, success, fallback usage)
- Audit logs for admin actions
- AI governance audit log
- Autonomous optimizer audit log

---

## File to Create

**`docs/PRODUCT_SPEC.md`** — Single markdown file containing the full specification above, formatted for readability with table of contents.

