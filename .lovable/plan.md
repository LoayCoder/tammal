

## Problem

The **My Support** page shows raw translation keys instead of human-readable labels:
- **Intent**: `crisisSupport.intents.talk_to_someone` — but the translation file only has `crisisSupport.intents.talk`, not `talk_to_someone`
- **Status**: `pending_first_aider_acceptance` shows "Awaiting Acceptance" correctly from translations, but intent is broken

The root cause is in `FirstAiderQuickConnect.tsx` — when creating a case, it sets `intent: 'talk_to_someone'`, but the i18n file uses the key `talk` (not `talk_to_someone`).

## Fix (Two-part)

### 1. Add missing intent key to both locale files

Add `"talk_to_someone": "Talk to Someone"` to `crisisSupport.intents` in `en.json` and `"talk_to_someone": "التحدث مع شخص"` in `ar.json`.

### 2. Fallback in MySupportPage rendering

Update the `CaseCardList` component to use a fallback when the translation key is missing, so it never shows a raw key:

```tsx
t(`crisisSupport.intents.${c.intent}`, c.intent)
```

This ensures if a new intent is added but translations haven't caught up, it shows the raw value rather than the full key path.

### Files to edit
- `src/locales/en.json` — add `talk_to_someone` to intents
- `src/locales/ar.json` — add `talk_to_someone` to intents

