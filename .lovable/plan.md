

# Enhanced Recent Nominations Table with Detail Dialog

## Problem
The Recent Nominations table currently only shows nominee name, theme, status, and date. It lacks:
- Who nominated (nominator name and role)
- Nominee's organizational placement (division, department, section)
- Nominator's department
- Clickable rows to view full nomination details (justification, examples, impact metrics, endorsement status)

## Changes

### 1. Enrich `useRecognitionMonitor.ts` — RecentNomination interface & data
Expand the `RecentNomination` type to include:
- `nominatorName`, `nominatorRole`
- `nomineeDepartmentName`, `nominatorDepartmentName`
- `nomineeDivisionName`, `nomineeSectionName` (resolved via employee's department → division lookup, and section lookup)
- `headline`, `justification`, `specificExamples`, `impactMetrics`, `endorsementStatus`

Fetch additional fields from `nominations` query (`nominator_id`, `nominator_role`, `nominator_department_id`, `justification`, `specific_examples`, `impact_metrics`, `endorsement_status`).

Resolve nominator name via the existing `empMap`. Resolve division/section names by:
- Adding `section_id` to the employees query
- Using the existing departments query (departments have `division_id` — need to fetch that too)
- Adding a divisions query
- Adding a sites/sections query

### 2. Update `RecognitionMonitor.tsx` — Recent Nominations section
- Add columns: Nominator, Nominator Role, Department, Division
- Make each row clickable (cursor-pointer + hover state)
- On click, open a **Dialog** showing the full nomination detail:
  - Nominee name + org placement (Division → Department → Section)
  - Nominator name + role + department
  - Headline
  - Justification (full text)
  - Specific examples (bulleted list)
  - Impact metrics (bulleted list)
  - Endorsement status badge
  - Status badge
  - Submission date

### 3. Translations
Add new keys in `en.json` and `ar.json` under `recognition.monitor.*`:
- `nominator`, `nominatorRole`, `division`, `section`, `headline`, `justification`, `specificExamples`, `impactMetrics`, `endorsementStatus`, `nominationDetails`, `orgPlacement`

### Files to modify
| File | Action |
|------|--------|
| `src/hooks/recognition/useRecognitionMonitor.ts` | Expand nominations query, add divisions/sites queries, enrich RecentNomination |
| `src/pages/admin/RecognitionMonitor.tsx` | Expand table columns, add detail dialog |
| `src/locales/en.json` | Add translation keys |
| `src/locales/ar.json` | Add translation keys |

