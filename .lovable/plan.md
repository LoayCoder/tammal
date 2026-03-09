

## Demographic Parity Shows "Insufficient data" — Root Cause

### Finding
The code is working correctly. The database currently has only **1 eligible nomination** (status = endorsed/shortlisted), and that nominee belongs to a single department ("Corporate Affairs"). The parity check requires **at least 2 departments** represented among nominees to calculate a meaningful ratio.

### Why This Happens
Line 255: `if (deptEntries.length < 2 || totalWinners === 0)` → with only 1 department, this correctly returns `insufficient_data`.

### Options

**Option A: No code change needed** — Once more nominations from different departments exist and results are recalculated, parity will display properly. This is the expected behavior.

**Option B: Relax the threshold** — Show parity analysis even with 1 department (showing 100% representation from that department). This is statistically meaningless but avoids the "insufficient data" message.

**Option C: Improve the message** — Make the insufficient data card more informative, showing exactly what's missing (e.g., "Only 1 department represented. Need nominees from at least 2 departments.").

### Recommendation
**Option C** — Keep the correct logic but improve the UI to explain *why* data is insufficient, so admins know what's needed. The card would show the current department count and the minimum required.

### Changes (Option C)
1. **Edge function**: Include `department_count` and `nominee_count` in the `insufficient_data` response
2. **FairnessReport.tsx**: Show a more descriptive message like "1 of 2 required departments represented" instead of the generic note

