

## Fix: `/employee/command-center` → 404

### Root Cause
The `PersonalCommandCenter` component is routed at `/my-workload` in `App.tsx`. There is no route for `/employee/command-center`. The user navigated to a non-existent path.

### Recommended Fix
Add a redirect in `App.tsx` so `/employee/command-center` redirects to `/my-workload` (keeping backward compatibility):

**File: `src/App.tsx`**
- After the existing redirect lines (~208-209), add:
```tsx
<Route path="/employee/command-center" element={<Navigate to="/my-workload" replace />} />
```

This is a single-line change. No other files need modification.

### Alternative
If you prefer `/employee/command-center` as the canonical URL, I would change the main route path and update all sidebar references. Let me know which approach you prefer.

