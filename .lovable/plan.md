

## Plan: Fix & Enhance Dashboard Endorsement Cards

### Problem
1. Missing translation key `recognition.endorsements.endorseFor` — shows raw key text
2. Card UI is plain and could be more attractive

### Changes

**1. Add missing translation keys (both locales)**

- `en.json`: Add `"endorseFor": "Endorse {{name}}'s nomination"` and `"dashboardEndorseAction": "Tap to endorse"` inside `recognition.endorsements`
- `ar.json`: Add `"endorseFor": "زكّ ترشيح {{name}}"` and `"dashboardEndorseAction": "انقر للتزكية"`

**2. Redesign `DashboardEndorsementRequests.tsx` for a more attractive UI**

- Add a gradient accent border/stripe on the start edge (purple/chart-3 gradient)
- Add a subtle animated pulse dot indicator (like a notification badge) on the icon
- Add a "Tap to endorse" secondary action hint
- Use slightly warmer background tint on the icon area
- Add a small badge showing "Pending" status
- Improve hover animation with scale transform

