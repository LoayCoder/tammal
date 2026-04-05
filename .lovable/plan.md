

## Team Pulse Action Hub — Phase 2: Product Definition & Final Scope

### Feature Purpose

The Team Pulse Action Hub is a premium engagement intelligence module that converts organization participation signals (check-ins, task completion, survey responses, peer appreciation, streaks) into a composite **Engagement Score** with AI-generated actionable insights and measurable targets. It sits on the Employee Dashboard as a daily-use premium card.

It is distinct from the Wellness Copilot (which focuses on wellness/mental health). Team Pulse focuses on **organizational engagement and participation health**.

---

### Current Implementation Status

Everything below is **already built and deployed**:

| Layer | Status | What Exists |
|-------|--------|-------------|
| Database | Done | `appreciations` table with RLS, `copilot_insight_cache` for daily caching |
| Edge Function | Done | `team-pulse-engine` — auth, role checks, data aggregation, composite score, Gemini AI generation, caching |
| Frontend Hooks | Done | `useTeamPulse`, `usePulseModes`, `useAppreciations` |
| UI Components | Done | `TeamPulseCard`, `PulseModeSwitcher`, `PulseInsightBlock`, `PulseTargetBlock`, `PulseActionPath`, `PulseEmptyState`, `PulseSkeleton`, `QuickAppreciationCard` |
| Dashboard | Done | Placed on EmployeeHome |
| Localization | Done | `pulse.*` keys in en.json and ar.json |

---

### Role-Based Behavior (Final Definition)

**Employee (Personal Mode Only)**
- Sees their own composite engagement score (0-100)
- Score based on: check-in consistency (30%), survey participation (20%), task completion (15%), appreciation activity (20%), streak health (15%)
- Gets one AI-generated insight about their participation pattern
- Gets one measurable target (e.g., "Daily check-ins this month: 10/15")
- Gets one action CTA (links to check-in, survey, or workload page)
- Can send peer appreciations via the Quick Appreciation Card
- **Cannot** see team or org data — mode switcher hidden

**Manager (Personal + Team Modes)**
- **Personal**: Same as Employee above
- **Team**: Sees aggregated engagement pulse for direct reports only (employees where `manager_id = manager.id`)
  - Team participation rate, task completion rate, appreciation activity
  - AI-generated team-level insight (never identifies individuals)
  - Recommended action for improving team engagement
  - CTA links to team dashboard or workload review
- Mode switcher visible: `Personal | Team`

**Admin — tenant_admin / super_admin (Personal + Team + Organization)**
- **Personal**: Same as Employee
- **Team**: Same as Manager (only if admin has direct reports)
- **Organization**: Org-wide engagement pulse across all active employees in tenant
  - Total participation rate, task completion, appreciation volume
  - AI insight about weak engagement areas and recovery opportunities
  - CTA links to admin dashboards, survey launch, or workload overview
- Mode switcher visible: `Personal | Team | Organization` (Team only shown if admin has direct reports)

---

### Data Sources (Per Mode)

| Signal | Weight | Personal | Team | Org |
|--------|--------|----------|------|-----|
| Check-in consistency (30d) | 30% | Own mood entries | Team participation rate | Org participation rate |
| Survey participation (30d) | 20% | Own response count | — | — |
| Task completion (30d) | 15% | Own completed/total ratio | Team ratio | Org ratio |
| Recognition activity (30d) | 20% | Sent + received appreciations | Team received | Org total |
| Streak health | 15% | Own streak days | Participation > 50% proxy | Participation proxy |

---

### Engagement Score Logic

Already implemented in `team-pulse-engine`:
- Each signal normalized to 0-100
- Weighted sum produces composite score 0-100
- Color coding: ≥75 green, ≥50 yellow-green, ≥30 amber, <30 red
- Trend: AI determines `up | down | stable` from data patterns

---

### AI Usage

- **Model**: `google/gemini-3-flash-preview` via Lovable AI gateway
- **Structured output**: Tool-calling schema (`generate_pulse_insight`) enforces exact JSON shape
- **Guardrails**: No clinical language, no individual identification in team/org, premium executive tone
- **Language**: Responds in Arabic or English based on user locale
- **Caching**: One generation per scope per day, stored in `copilot_insight_cache`
- **Fallback**: Returns `{ insufficientData: true, fallbackCta }` when no activity data exists

---

### UI Placement (Mobile Dashboard)

Current order on EmployeeHome (already integrated):
1. Greeting + VIP Stat Chips
2. Engagement Rank Badge
3. Wellness Copilot (AI wellness insights)
4. **Team Pulse Action Hub** (engagement score + actions)
5. **Quick Appreciation Card** (send peer kudos)
6. Support Hub
7. Pending Endorsements → Surveys → Check-in → Prayer → Workload

---

### KPIs / Business Value

| KPI | Measurement |
|-----|-------------|
| Daily active engagement | % of employees who view their Pulse card daily |
| Appreciation adoption | Number of appreciations sent per week per tenant |
| Action completion rate | % of users who click CTA after seeing insight |
| Check-in consistency lift | Before/after comparison of check-in streaks |
| Manager engagement with team mode | % of managers switching to team mode weekly |
| Survey participation lift | Correlation between pulse nudges and survey response rates |

---

### What Is Missing / Gaps to Address

The feature is functionally complete. The following are refinement opportunities (not blockers):

| Gap | Priority | Description |
|-----|----------|-------------|
| No history/trend view | Low | Users cannot see engagement score over time (only today's snapshot) |
| Appreciation notifications | Low | Recipients are not notified when they receive an appreciation |
| No campaign/nudge system | Out of scope | Ability to push engagement campaigns — future phase |
| No appreciation feed | Low | No way to browse received appreciations in a list view |

---

### Conclusion

The Team Pulse Action Hub is **fully implemented end-to-end** across all layers: database, edge function, AI integration, frontend hooks, premium UI, dashboard integration, and localization. The role-based behavior, data scoping, and privacy controls are all enforced server-side. No further implementation phases are required for the core feature to be production-ready.

