

## Fix: endorsement_status Not Updated on Manager Approval

### Problem
When a manager approves a nomination, `useNominationApprovals.ts` sets `status: 'endorsed'` but does **not** update `endorsement_status` — it remains `'pending'`. The NominationCard then shows the top badge as "Endorsed" (from `status`) but the bottom badge as "Pending" (from `endorsement_status`).

### Change

**File: `src/hooks/recognition/useNominationApprovals.ts`** (line 70-75)

Add `endorsement_status: 'sufficient'` to the update payload in `approveNomination`:

```typescript
const updateData: Record<string, any> = {
  manager_approval_status: 'approved',
  manager_approved_by: user.id,
  manager_approval_at: new Date().toISOString(),
  status: 'endorsed',
  endorsement_status: 'sufficient',  // ← add this
};
```

This ensures both fields stay in sync when a manager approves. The existing endorsement submission flow already does this correctly (line 123 in `useEndorsements.ts`).

**Single file, single line addition. No other changes needed.**

