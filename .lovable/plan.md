

# Fix: First Aider and Crisis Support sharing the same URL

## Problem
In `src/components/layout/AppSidebar.tsx` line 205, the "First Aider" nav item has `url: "/crisis-support"` — identical to the "Crisis Support" item on line 203. This causes both sidebar entries to navigate to the same page.

## Fix
Change the First Aider URL from `"/crisis-support"` to `"/first-aider"` in the sidebar menu config. The `/first-aider` route already exists in `App.tsx` and renders the `FirstAiderDashboard` component.

### File: `src/components/layout/AppSidebar.tsx`
**Line 205** — Change:
```tsx
{ title: t('crisisSupport.nav.firstAider'), url: "/crisis-support", icon: HeartHandshake, access: 'employee' },
```
To:
```tsx
{ title: t('crisisSupport.nav.firstAider'), url: "/first-aider", icon: HeartHandshake, access: 'employee' },
```

One line change. No other files affected.

