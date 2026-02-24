

# Add Branch/Division/Department/Section Comparative Analysis

## Problem
The Divergence Heatmap and BAI comparative data currently only covers **Departments**. The user wants the synthesis comparison to span all four organizational unit types: Branch, Division, Department, and Section.

## Solution
Extend the synthesis engine and Divergence Heatmap to compute and display BAI scores for all four org unit types, with a tab selector to switch between them.

## Changes

### 1. `src/lib/synthesisEngine.ts`
- Rename `departmentBAI` to a generic structure
- Update `SynthesisResult` to include four arrays: `branchBAI`, `divisionBAI`, `departmentBAI`, `sectionBAI` (all typed as `DepartmentBAIItem[]`)
- Update `computeSynthesis` to accept four org unit data arrays instead of one

### 2. `src/hooks/useOrgAnalytics.ts`
- Build synthesis data for all four org unit types from `orgComparison.branches`, `orgComparison.divisions`, `orgComparison.departments`, and `orgComparison.sections`
- Each unit maps its `avgScore` (check-in avg) against the global `surveyStructural.categoryHealthScore` (survey avg) to compute per-unit BAI
- Pass all four arrays to `computeSynthesis`

### 3. `src/components/dashboard/comparison/DivergenceHeatmap.tsx`
- Add a `Tabs` component with four tabs: Branch, Division, Department, Section
- Each tab renders the existing heatmap grid for the corresponding BAI array
- Reuse existing color logic and privacy guard (< 5 employees = hidden)

### 4. `src/locales/en.json` and `src/locales/ar.json`
- Add translation keys for the four tab labels in the heatmap context

---

## Technical Details

### Updated `SynthesisResult` interface
```text
SynthesisResult {
  ...existing fields...
  branchBAI: DepartmentBAIItem[]
  divisionBAI: DepartmentBAIItem[]
  departmentBAI: DepartmentBAIItem[]   (already exists)
  sectionBAI: DepartmentBAIItem[]
}
```

### Data mapping in `useOrgAnalytics.ts`
For each unit type (branch, division, department, section), map from `orgComparison[type]`:
```text
{ id, name, nameAr, checkinAvg: unit.avgScore, surveyAvg: surveyStructural.categoryHealthScore, employeeCount: unit.employeeCount }
```
Then filter by employeeCount >= 5 and compute BAI in `computeSynthesis`.

### DivergenceHeatmap tabs
The heatmap component will receive all four arrays and render a tabbed view. The grid rendering logic stays identical -- only the data source changes per tab.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/synthesisEngine.ts` | Add `branchBAI`, `divisionBAI`, `sectionBAI` to `SynthesisResult`; update `computeSynthesis` to accept and process all four unit type arrays |
| `src/hooks/useOrgAnalytics.ts` | Build synthesis input data for branches, divisions, and sections (departments already done) |
| `src/components/dashboard/comparison/DivergenceHeatmap.tsx` | Add tabbed UI (Branch / Division / Department / Section) to switch between heatmap datasets |
| `src/locales/en.json` | Add ~4 keys for heatmap tab labels |
| `src/locales/ar.json` | Add ~4 Arabic keys for heatmap tab labels |

No new files are needed. No database changes required.
