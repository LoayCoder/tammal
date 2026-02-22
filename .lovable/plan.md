

# Crisis Support -- Fix First Aider Assignment & Creation Gaps

## Problem Summary

The admin "First Aiders" tab and "Emergency Contacts" tab have broken create flows. When clicking "Add First Aider", the dialog opens but the save handler shows a `toast.error('Please assign a user first')` and does nothing. Similarly, "Add Contact" shows `toast.error('Tenant context required')` and returns. These are placeholder error messages left during initial implementation -- the actual logic to resolve `tenant_id` and `user_id` was never wired up.

---

## Issues Found

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Create First Aider is broken**: `handleSave` returns early with hardcoded error "Please assign a user first" because there's no user picker and no `tenant_id` resolution | `CrisisSettings.tsx` line 123-127 | Critical |
| 2 | **Create Emergency Contact is broken**: `handleSave` returns early with "Tenant context required" because `tenant_id` is not injected on create | `CrisisSettings.tsx` line 371-374 | Critical |
| 3 | **No employee/user picker** in the Add First Aider dialog -- the dialog has name/department/bio fields but no way to link a first aider to an actual user account | `CrisisSettings.tsx` dialog | Critical |
| 4 | **Schedules tab doesn't auto-load** when selecting a first aider -- `handleLoadSchedule` exists but is never called | `CrisisSettings.tsx` line 241 | Medium |
| 5 | **Hardcoded English strings** in error messages: "Please assign a user first", "Tenant context required" | `CrisisSettings.tsx` lines 125, 373 | Low |

---

## Fix Plan

### 1. Fix First Aiders Tab -- Add Employee/User Picker + Working Create

**Changes to the `FirstAidersTab` in `CrisisSettings.tsx`:**

- Import `useProfile` to get the admin's `tenant_id` from their profile
- Import `useEmployees` to get a list of employees in the tenant
- Add a `user_id` field to the form state
- Add an employee selector (Select dropdown) in the create dialog that shows tenant employees, allowing the admin to pick which employee becomes a first aider
- Auto-fill `display_name` and `department` from the selected employee
- On save (create), pass `tenant_id` (from profile) and `user_id` (from selected employee) to `createFirstAider.mutateAsync`
- On save (edit), keep existing behavior but remove the early return

### 2. Fix Emergency Contacts Tab -- Inject tenant_id on Create

**Changes to `EmergencyContactsTab`:**

- Import `useProfile` to get the admin's `tenant_id`
- On create, pass `tenant_id` alongside the form data to `createContact.mutateAsync`
- Remove the early-return error

### 3. Fix Schedules Tab -- Auto-Load Schedule on Selection

- Call schedule-loading logic in a `useEffect` or directly when `selectedFA` changes, rather than relying on the never-called `handleLoadSchedule`

### 4. Replace Hardcoded English Strings

- Replace all hardcoded error strings with translation keys
- Add new keys to `en.json` and `ar.json`

---

## Files to Modify

| File | Change |
|---|---|
| `src/pages/admin/CrisisSettings.tsx` | Fix create flows for first aiders and emergency contacts; add employee picker; fix schedule auto-load |
| `src/locales/en.json` | Add missing keys if needed |
| `src/locales/ar.json` | Add matching Arabic keys |

---

## Technical Details

**Employee picker approach:**
- Use `useEmployees()` to fetch employees for the current tenant
- Filter out employees who are already first aiders (compare `user_id` against existing `firstAiders` list)
- Show a `<Select>` dropdown with employee name + department
- When an employee is selected, auto-populate `display_name` and `department` from the employee record
- Store the selected employee's `user_id` in form state

**Tenant ID resolution:**
- Use `useProfile()` to get the logged-in admin's `tenant_id` from their profile
- Pass this `tenant_id` to both `createFirstAider` and `createContact` mutations

