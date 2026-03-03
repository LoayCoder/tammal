

# First Aider Popup Card from Dashboard

## What
Replace the `<Link to="/first-aider">` quick action on the Employee Dashboard with a **Dialog popup** that lets users browse available First Aiders and choose an action (Urgent Call, Chat, or Book 1-to-1 Session) -- all without leaving the dashboard.

Also update the sidebar link from `/first-aider` to open the same flow via `/crisis-support`.

## Design

```text
┌──────────────────────────────────────────────┐
│  🤝 Connect with a First Aider              │
│  ─────────────────────────────────────────── │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 👤 Ahmed K.  ⭐4.8  🌐 en,ar        │    │
│  │    Anxiety · Work Stress  ● Online   │    │
│  │    [🚨 Urgent] [💬 Chat] [📅 Book]  │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 👤 Sara M.   ⭐4.5  🌐 ar           │    │
│  │    Overwhelmed · Self-care ● Busy    │    │
│  │    [🚨 Urgent] [💬 Chat] [📅 Book]  │    │
│  └──────────────────────────────────────┘    │
│  ...                                         │
│                                              │
│  (If "Book" clicked → inline booking widget) │
└──────────────────────────────────────────────┘
```

- Only **active, available** First Aiders shown (filtered by `is_active` and schedule status)
- Each card shows: name, rating, languages, specializations, online status
- Three action buttons per First Aider:
  - **Urgent Call** → creates a crisis case with `urgency_level: 5` and `preferred_contact_method: 'voice'`, then navigates to `/my-support`
  - **Chat** → creates a crisis case with `preferred_contact_method: 'chat'`, navigates to `/my-support`
  - **Book Session** → expands `EmployeeBookingWidget` inline below that card

## File Changes

### 1. Create: `src/components/crisis/FirstAiderQuickConnect.tsx`
New Dialog-based component that:
- Uses `useFirstAiders(tenantId)` to fetch available first aiders with status
- Uses `useCrisisCases().createCase` to create cases for urgent/chat actions
- Renders a scrollable list of First Aider cards with action buttons
- Toggles `EmployeeBookingWidget` inline when "Book" is selected
- Accepts `open`, `onOpenChange`, and `tenantId` props

### 2. Edit: `src/pages/EmployeeHome.tsx`
- Import `FirstAiderQuickConnect`
- Replace `<Link to="/first-aider">` with an `onClick` that sets `openTool` to `'first-aider-connect'`
- Add the `<FirstAiderQuickConnect>` Dialog controlled by that state

### 3. Edit: `src/components/layout/AppSidebar.tsx`
- Change sidebar "First Aider" link from `/first-aider` to `/crisis-support`

