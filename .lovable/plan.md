

# First Aider Profile & Action Panel on Match Selection

## What
When a user clicks on a matched First Aider in the `matching` step of `CrisisRequestPage`, instead of just highlighting the card, open a **detailed profile panel** with the First Aider's info on the left and **action buttons** (Chat, Call, Book Session) on the right.

## Design
Replace the current "select + confirm" pattern with a **two-column layout** that appears when a First Aider is clicked:

```text
┌─────────────────────────────────────────────┐
│  Match Results (list above)                 │
├──────────────────────┬──────────────────────┤
│  Profile Card        │  Actions Panel       │
│  ─────────────       │  ──────────────      │
│  👤 Display Name     │  💬 Start Chat       │
│  ⭐ Rating (4.5)     │  📞 Voice Call       │
│  🌐 en, ar           │  📅 Book Session     │
│  📋 Specializations  │     (booking widget) │
│  📊 Score: 85%       │                      │
│  🔄 Active cases: 2  │                      │
│  ● Online/Offline    │                      │
└──────────────────────┴──────────────────────┘
```

- Clicking **Start Chat** → creates/confirms case and navigates to `/my-support` (existing flow)
- Clicking **Voice Call** → same but with `preferred_contact_method: 'voice'`
- Clicking **Book Session** → expands the `EmployeeBookingWidget` inline in the actions panel

## File Changes

### Edit: `src/pages/crisis/CrisisRequestPage.tsx`
1. Import `EmployeeBookingWidget` from `@/components/crisis/EmployeeBookingWidget`
2. Add state: `showBooking` boolean
3. Replace the matching step's simple selection + confirm button with:
   - Keep the match list at the top (clickable cards)
   - When a match is selected (`selectedMatchId` is set), render a **detail panel** below the list with two columns:
     - **Left column**: First Aider profile card (name, rating, languages, specializations, score, status, response time, active cases)
     - **Right column**: Three action buttons stacked vertically (Chat, Call, Book). When "Book" is clicked, toggle `showBooking` to render `EmployeeBookingWidget` inline
   - Chat/Call buttons call `handleConfirmMatch` (navigates to `/my-support`)
4. Use responsive layout: `grid grid-cols-1 sm:grid-cols-2` for the profile + actions panel

Single file edit. No new components needed — reuses existing `EmployeeBookingWidget`.

