

## Complete Redemption Workflow: Auto-Fulfill + Email

### What Changes

**Current**: User redeems → status `pending` → admin approves → admin marks fulfilled.
**New**: User redeems → status immediately `fulfilled` → email with claim instructions sent automatically. No admin approval needed.

### Database Changes

1. **Update `redeem_points` function**: Change the inserted `redemption_requests` status from `'pending'` to `'fulfilled'` and set `fulfilled_at = now()`.

2. **Add `fulfillment_instructions` columns to `redemption_options`**:
   - `fulfillment_instructions text` — English instructions shown in email
   - `fulfillment_instructions_ar text` — Arabic instructions

### Edge Function: `send-redemption-email`

New edge function (follows the same pattern as `send-invitation-email` using Resend):
- Receives: user email, reward name, points spent, fulfillment instructions, language
- Sends a branded email with claim instructions
- Gracefully skips if `RESEND_API_KEY` is not configured

### Frontend Changes

1. **`useRedemption.ts`** — After successful `redeem_points` RPC call, invoke the `send-redemption-email` edge function with the option details and user email. Update success toast to say "Redeemed successfully! Check your email."

2. **`RedemptionCard.tsx`** — Add a confirmation dialog before redeeming (AlertDialog: "Are you sure you want to redeem X for Y points?").

3. **`RedemptionCatalog.tsx`** — No structural changes needed; the card already disables when `balance < points_cost`.

4. **Admin `RedemptionManagement.tsx`**:
   - Add `fulfillment_instructions` textarea to the create option dialog
   - Remove the approve/reject/fulfill action buttons (no longer needed since auto-fulfilled)
   - Keep the requests table as a read-only log showing fulfilled redemptions

5. **Translation files** — Add keys for confirmation dialog, email success message, fulfillment instructions label.

### Files to Create/Modify

- **Create**: `supabase/functions/send-redemption-email/index.ts`
- **Migration**: Alter `redemption_options` + update `redeem_points` function
- **Modify**: `src/hooks/recognition/useRedemption.ts`, `src/components/recognition/RedemptionCard.tsx`, `src/pages/admin/RedemptionManagement.tsx`, `src/locales/en.json`, `src/locales/ar.json`

