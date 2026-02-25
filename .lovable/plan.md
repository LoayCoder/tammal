

# Employee Recognition & Awards System

## Overview
A comprehensive recognition platform with award cycles, nominations, peer endorsements, multi-criteria voting, fairness auditing, and a points economy with redemption catalog. This is a large feature that will be implemented in **6 phases**.

---

## Phase 1: Database Schema & Storage

Create all core tables adapted to the project's multi-tenant architecture (every table gets `tenant_id` + `deleted_at` for soft deletes + RLS policies).

**Tables to create:**
- `award_cycles` -- cycle configuration, timeline, fairness config, status workflow
- `award_themes` -- themes within a cycle, nomination/voting rules, rewards config
- `judging_criteria` -- weighted criteria per theme with scoring guides
- `nominations` -- nominee/nominator, justification, AI analysis, endorsement status
- `nomination_attachments` -- evidence files linked to nominations
- `peer_endorsements` -- endorser confirmation, relationship type, validation
- `votes` -- multi-criteria scores, voter weight, justifications for extreme scores
- `theme_results` -- winners, fairness report, appeal status
- `nominee_rankings` -- detailed scoring breakdown per nominee
- `appeals` -- post-result dispute handling
- `points_transactions` -- points ledger (credits, debits, expiry)
- `redemption_options` -- catalog of rewards
- `redemption_requests` -- employee redemption tracking

**Adaptations from the spec:**
- Replace `REFERENCES users(id)` with `REFERENCES profiles(user_id)` or raw UUID (no FK to auth.users)
- Replace `CHECK` constraints with validation triggers (per project standards)
- Add `tenant_id` to every table with RLS using `get_user_tenant_id(auth.uid())`
- Add `deleted_at` column for soft deletes
- Create a `recognition-attachments` storage bucket

---

## Phase 2: Core Hooks & Award Cycle Management (Admin)

**Files to create:**
- `src/hooks/recognition/useAwardCycles.ts` -- CRUD for cycles + status advancement
- `src/hooks/recognition/useAwardThemes.ts` -- theme management within a cycle
- `src/hooks/recognition/useJudgingCriteria.ts` -- criteria CRUD per theme
- `src/pages/admin/RecognitionManagement.tsx` -- admin landing page with cycle list
- `src/components/recognition/CycleBuilder.tsx` -- multi-step wizard (Basics, Themes, Fairness, Review)
- `src/components/recognition/ThemeBuilder.tsx` -- theme card editor with rules config
- `src/components/recognition/CriteriaEditor.tsx` -- weighted criteria with scoring guide
- `src/components/recognition/CycleStatusBadge.tsx` -- status indicator component
- `src/components/recognition/CycleTimeline.tsx` -- visual timeline of cycle phases

**Route:** `/admin/recognition` (AdminRoute-protected)

**Sidebar:** Add "Recognition" item under a new "Recognition & Awards" group in the sidebar.

---

## Phase 3: Nomination & Endorsement System

**Files to create:**
- `src/hooks/recognition/useNominations.ts` -- submit, list, filter nominations
- `src/hooks/recognition/useEndorsements.ts` -- submit/list peer endorsements
- `src/pages/recognition/NominatePage.tsx` -- employee-facing nomination wizard
- `src/pages/recognition/MyNominationsPage.tsx` -- view sent/received nominations
- `src/components/recognition/NominationWizard.tsx` -- 4-step wizard (Select Nominee, Write Justification, Request Endorsements, Review & Submit)
- `src/components/recognition/EndorsementCard.tsx` -- endorsement request/response UI
- `src/components/recognition/NominationCard.tsx` -- nomination display with status
- `src/components/recognition/QuotaIndicator.tsx` -- manager nomination quota display

**Key logic:**
- Manager quota enforcement (max 30% of team for teams 5+)
- Minimum word count validation on justification (200-10,000 chars)
- Cross-department evidence capture
- Endorsement counting toward "sufficient" threshold

---

## Phase 4: Voting System

**Files to create:**
- `src/hooks/recognition/useVoting.ts` -- ballot fetching, vote submission, weight calculation
- `src/pages/recognition/VotingBoothPage.tsx` -- employee voting interface
- `src/components/recognition/VotingBooth.tsx` -- sequential nominee scoring
- `src/components/recognition/CriterionScorer.tsx` -- individual criterion slider/selector
- `src/components/recognition/JustificationPanel.tsx` -- mandatory justification for scores of 1 or 5
- `src/components/recognition/VotingProgress.tsx` -- progress bar across nominees

**Key logic:**
- Voter weight calculation based on relationship, department proximity, and history
- Extreme score justification enforcement (min 50 chars)
- One vote per voter per nomination (unique constraint)
- Participation points awarded on vote submission

---

## Phase 5: Results, Fairness & Appeals

**Files to create:**
- `src/hooks/recognition/useResults.ts` -- fetch results, rankings, fairness reports
- `src/hooks/recognition/useAppeals.ts` -- submit/review appeals
- `supabase/functions/calculate-recognition-results/index.ts` -- edge function for score calculation, bias detection, clique analysis, demographic parity
- `src/pages/admin/RecognitionResults.tsx` -- admin results & fairness dashboard
- `src/components/recognition/FairnessReport.tsx` -- demographic parity charts, clique detection cards, anomaly table
- `src/components/recognition/RankingsTable.tsx` -- detailed nominee rankings with score breakdown
- `src/components/recognition/AppealForm.tsx` -- appeal submission for employees
- `src/components/recognition/WinnerAnnouncement.tsx` -- celebration UI for announced results

**Edge function logic:**
- Weighted average score calculation per nomination
- Clique detection (mutual nomination patterns across cycles)
- Visibility bias correction for remote workers
- Vote anomaly detection
- Confidence interval calculation

---

## Phase 6: Points Economy & Redemption

**Files to create:**
- `src/hooks/recognition/usePoints.ts` -- balance, transaction history, redemption
- `src/hooks/recognition/useRedemption.ts` -- catalog browsing, redemption requests
- `src/pages/recognition/PointsDashboard.tsx` -- employee points balance & history
- `src/pages/recognition/RedemptionCatalog.tsx` -- browsable reward catalog
- `src/pages/admin/RedemptionManagement.tsx` -- admin: manage options, approve requests
- `src/components/recognition/PointsBalanceCard.tsx` -- current balance display
- `src/components/recognition/TransactionHistory.tsx` -- points ledger table
- `src/components/recognition/RedemptionCard.tsx` -- individual reward option card
- `supabase/functions/expire-recognition-points/index.ts` -- cron-triggered point expiry

**Cron job:** Weekly point expiry check via `pg_cron` + `pg_net` calling the edge function.

---

## Localization

All phases include adding translation keys to both `src/locales/en.json` and `src/locales/ar.json` under a `recognition` namespace covering cycle management, nominations, voting, results, points, and redemption flows. All UI uses `ms-`/`me-`/`ps-`/`pe-` logical properties per RTL standards.

---

## Implementation Order

| Phase | Scope | Estimated Complexity |
|-------|-------|---------------------|
| 1 | Database schema, RLS, storage bucket | High (13 tables + policies) |
| 2 | Award cycle admin UI + hooks | Medium |
| 3 | Nomination & endorsement system | Medium-High |
| 4 | Voting booth & scoring | Medium |
| 5 | Results calculation, fairness, appeals | High (edge function + AI) |
| 6 | Points economy & redemption | Medium |

Each phase will be implemented sequentially. Say **NEXT** after each phase to proceed.

