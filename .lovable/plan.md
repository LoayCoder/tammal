

# Fairness Summary Panel in Recognition Monitor

## Overview
Add a new **"Fairness"** tab to the Recognition Monitor showing side-by-side weight comparisons across the three evaluation stages: original criteria → nomination weights → manager adjustments → voting averages.

## Data Strategy

Create a new hook `useFairnessSummary(cycleId)` that fetches and aggregates:

1. **`judging_criteria`** — original weights per theme (already available via `useRecognitionMonitor` themes)
2. **`nomination_criteria_evaluations`** — nominator-assigned weights per criterion per nomination
3. **`nominations.manager_criteria_adjustments`** — manager-adjusted weights (JSON column)
4. **`vote_criteria_evaluations`** — voter-adjusted weights, averaged across all voters per nomination

The hook returns data grouped by **theme → nomination → criteria stages**, producing the `StagedWeight[]` shape already consumed by `CriteriaSummaryCard`.

## UI Structure (new tab in RecognitionMonitor)

```text
Tabs: [Nominations] [Approvals] [Voting] [Fairness ← NEW]

Fairness tab:
  ┌─ Theme: "Innovation Award" ─────────────────────────┐
  │  ┌─ Nominee: Ahmed Ali ──────────────────────────┐  │
  │  │  CriteriaSummaryCard (reused)                  │  │
  │  │  Criterion | Original | Nomination | Manager | Voting Avg │
  │  │  Teamwork  |   40%    |    35%     |   38%   |   37%      │
  │  │  Impact    |   60%    |    65%     |   62%   |   63%      │
  │  └────────────────────────────────────────────────┘  │
  │  ┌─ Nominee: Sara Khan ──────────────────────────┐   │
  │  │  ...                                          │   │
  │  └───────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| File | Action |
|---|---|
| `src/hooks/recognition/useFairnessSummary.ts` | **Create** — fetches criteria, nomination evals, manager adjustments, vote evals; aggregates into staged weights per theme/nomination |
| `src/pages/admin/RecognitionMonitor.tsx` | **Edit** — add "Fairness" tab with `Scale` icon, render grouped `CriteriaSummaryCard` per theme/nomination |
| `src/locales/en.json` | **Edit** — add ~5 translation keys for fairness tab |
| `src/locales/ar.json` | **Edit** — Arabic translations |

## Reuse

The existing `CriteriaSummaryCard` component already renders the exact table layout needed — no new UI components required.

