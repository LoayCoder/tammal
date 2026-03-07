

# Award Cycle Fairness & Weighted Criteria System

## Current State

The system already has:
- **`judging_criteria` table** — per-theme criteria with `name`, `description`, `weight`, `scoring_guide`
- **`CriteriaEditor` component** — admin can add/edit criteria per theme (but weight is stored as decimal 0-1, not percentage)
- **`votes` table** — stores `criteria_scores` (JSON of criterion_id → rating) and `justifications`
- **`VotingBooth`** — scores criteria 1-5 via sliders, no weight adjustment by voters
- **`NominationWizard`** — collects justification text only, no per-criterion evaluation
- **`useNominationApprovals`** — manager approve/reject with no criteria editing
- **Fairness config** in `award_cycles.fairness_config` JSON — bias detection + audit settings only

## What Needs to Change

### 1. Database Changes (3 migrations)

**Migration 1: New tables for nomination/vote criteria evaluations + fairness config extension**

```sql
-- Nomination criteria evaluations (nominator's per-criterion weights + justification)
CREATE TABLE public.nomination_criteria_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nomination_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES judging_criteria(id),
  weight NUMERIC NOT NULL,  -- percentage 0-100
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(nomination_id, criterion_id)
);
ALTER TABLE public.nomination_criteria_evaluations ENABLE ROW LEVEL SECURITY;

-- Vote criteria evaluations (voter's adjusted weights + rating + justification)
CREATE TABLE public.vote_criteria_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES judging_criteria(id),
  original_weight NUMERIC NOT NULL,
  adjusted_weight NUMERIC NOT NULL,
  rating INTEGER NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(vote_id, criterion_id)
);
ALTER TABLE public.vote_criteria_evaluations ENABLE ROW LEVEL SECURITY;
```

With RLS policies for tenant isolation.

**Migration 2: Add `voting_weight_adjustment_limit` to fairness_config**
- No schema change needed — this is stored in the existing `fairness_config` JSON field on `award_cycles`
- Default: 30 (meaning ±30%)

**Migration 3: Add `manager_criteria_adjustments` JSON column to `nominations`**
- Stores manager's adjusted weights per criterion during approval

### 2. Fairness Config Extension

Update `FairnessSettings` type and `buildFairnessConfig` in `src/features/cycle-builder/types.ts`:
- Add `votingWeightAdjustmentLimit: number` (default 30)
- Add to `parseFairnessConfig` in CycleEditDialog

Add a new slider in the Fairness tab: "Voting Weight Adjustment Limit: ±{value}%"

### 3. Criteria Editor Enhancement

Update `CriteriaEditor` to:
- Display weights as percentages (already does, but stored as decimal — normalize to 0-100 integer storage)
- Show real-time validation: total must = 100%
- Block saving the cycle if total ≠ 100%

### 4. Nomination Wizard — Step 2.5: Criteria Evaluation

Add a new step `criteria_evaluation` between `justification` and `endorsements`:
- Fetch `judging_criteria` for the selected theme
- For each criterion, show: name, description, weight slider (must total 100%), justification textarea
- On submit, write rows to `nomination_criteria_evaluations`
- Validation: total weight must equal 100%

New component: `NominationCriteriaForm` — reusable weight+justification form per criterion.

### 5. Manager Approval Enhancement

Update `ManagerApprovalCard` and `useNominationApprovals`:
- Display nomination's per-criterion weights and justifications (from `nomination_criteria_evaluations`)
- Allow manager to adjust weights and justifications
- On approve, save adjusted values to `nominations.manager_criteria_adjustments` JSON
- Validation: adjusted weights must total 100%

### 6. Voting Booth Enhancement

Update `VotingBooth` and `CriterionScorer`:
- Fetch the cycle's `votingWeightAdjustmentLimit` from `fairness_config`
- Show each criterion with its default weight + adjustment slider
- Constrain slider to ±limit% of original weight
- Validate total adjusted weights = 100%
- On submit, write `vote_criteria_evaluations` rows alongside existing vote record
- Update scoring: `Final Score = Σ(rating × adjusted_weight / 100)`

New component: `CriteriaWeightSlider` — slider with min/max bounds and percentage display.

### 7. Scoring Calculation Update

Update `supabase/functions/calculate-recognition-results/index.ts`:
- Use `vote_criteria_evaluations` for weighted scoring instead of flat `criteria_scores`
- Formula: `Final Score = Σ(criterion_rating × adjusted_weight) / 100`

### 8. Fairness Transparency Panel

New component: `FairnessSummaryPanel` — shows for each nomination:
- Original criteria weights (from `judging_criteria`)
- Nominator's weights (from `nomination_criteria_evaluations`)
- Manager adjustments (from `nominations.manager_criteria_adjustments`)
- Voting average adjustments (from `vote_criteria_evaluations`)

Displayed in the Recognition Monitor and nomination detail dialog.

### 9. Reusable UI Components

| Component | Purpose |
|---|---|
| `CriteriaWeightTable` | Read-only table of criteria with weights |
| `CriteriaWeightSlider` | Bounded weight adjustment slider |
| `CriteriaEvaluationForm` | Editable weight+justification per criterion |
| `CriteriaSummaryCard` | Side-by-side comparison of weights across stages |

### 10. Translation Keys

Add ~30 new i18n keys for criteria evaluation labels, validation messages, and fairness panel text.

## Implementation Order

1. Database migrations (2 new tables + RLS)
2. Types & fairness config extension
3. Reusable UI components (`CriteriaWeightSlider`, `CriteriaEvaluationForm`)
4. Fairness tab update (adjustment limit slider)
5. Nomination wizard criteria step
6. Manager approval criteria editing
7. Voting booth weight adjustment
8. Scoring calculation update
9. Fairness transparency panel
10. Translation keys

## Technical Notes

- The existing `judging_criteria.weight` is stored as decimal (0-1). The new system uses percentage (0-100) for `nomination_criteria_evaluations` and `vote_criteria_evaluations`. Conversion will be handled at the application layer.
- The `votes.criteria_scores` JSON field continues to store raw ratings. The new `vote_criteria_evaluations` table provides the normalized, per-criterion detail.
- All new tables include `tenant_id` and RLS for tenant isolation.
- Soft delete via `deleted_at` on all new tables.

