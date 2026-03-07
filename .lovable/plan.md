

# Remove Daily Check-in from Sidebar

## What
Remove the "Daily Check-in" sidebar item since users already access it from the Overview tab on the dashboard.

## Changes

### 1. `src/components/layout/AppSidebar.tsx`
- Remove the Daily Check-in item from the Wellness group's `items` array (line 197: `{ title: t('nav.dailyCheckin'), url: "/", icon: Heart, access: 'employee' }`)
- The Wellness group will still render because it contains the Mental Toolkit nested sections and Spiritual Wellbeing sections

### 2. No route changes needed
- The `/employee/wellness` route stays in `App.tsx` (it may still be linked elsewhere)
- The inline Daily Check-in on the EmployeeHome/Overview tab remains untouched

