

## Implement Demographic Parity Analysis

### Problem
The demographic parity section in the fairness report is hardcoded to `{ status: 'not_evaluated', note: 'Requires department/demographic data integration' }`. The data needed (employees with `department_id`) already exists.

### Solution
Implement actual demographic parity calculation in the edge function and enhance the UI to display the results.

### Edge Function Changes (`calculate-recognition-results/index.ts`)

**1. Fetch nominee department data** — After getting nominations, query the `employees` table to get `department_id` for each `nominee_id`.

**2. Calculate demographic parity** — Compare the distribution of winners/top-ranked nominees across departments vs the overall nominee pool distribution:
- Group all nominees by department
- Group top 3 (winners) by department
- Calculate representation ratio per department: `(% of winners from dept) / (% of nominees from dept)`
- A ratio close to 1.0 = fair; significantly above/below = over/under-represented
- Compare against the `demographicParityTarget` from fairness config (default 0.8)

**3. Output structure:**
```typescript
fairnessReport.demographic_parity = {
  status: 'balanced' | 'imbalanced' | 'insufficient_data',
  score: 0.85,  // parity index (0-1)
  target: 0.80,
  departments: {
    'dept-name': { nominees: 5, winners: 1, ratio: 0.8 },
    ...
  },
  underrepresented: ['dept-name'],
  overrepresented: ['dept-name'],
  note: 'Summary text'
}
```

### UI Changes (`FairnessReport.tsx`)

Update the Demographic Parity card to show:
- Status badge with color coding (green for balanced, yellow for imbalanced, gray for insufficient data)
- Parity score vs target
- List of under/over-represented departments
- Per-department breakdown if available

### Translation Keys
- `recognition.results.parityBalanced` — "Balanced" / "متوازن"
- `recognition.results.parityImbalanced` — "Imbalanced" / "غير متوازن"
- `recognition.results.insufficientData` — "Insufficient data" / "بيانات غير كافية"
- `recognition.results.parityScore` — "Parity score: {{score}} (target: {{target}})" / "درجة التكافؤ: {{score}} (الهدف: {{target}})"
- `recognition.results.underrepresented` — "Underrepresented" / "ناقص التمثيل"
- `recognition.results.overrepresented` — "Overrepresented" / "زائد التمثيل"

### Files to Change
1. **`supabase/functions/calculate-recognition-results/index.ts`** — Add employee department lookup + parity calculation (replace line 211)
2. **`src/components/recognition/FairnessReport.tsx`** — Enhanced parity display with breakdown
3. **`src/locales/en.json`** + **`src/locales/ar.json`** — New keys

