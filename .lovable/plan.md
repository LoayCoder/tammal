

## Fix Install UI, Layout Spacing, and Pending Questions Enhancement

### 1. PWA Manifest Branding Fix (`vite.config.ts`)

The manifest currently says "SaaS Admin Platform" — this is what the browser install dialog shows. Fix:

- Change `name` to `"Tammal"` and `short_name` to `"Tammal"`
- Change `description` to `"Tammal – Employee Wellness Platform"`
- Update `theme_color` to match the brand primary color

The install dialog icon itself comes from `public/pwa-192x192.png` and `public/pwa-512x512.png` — these are generic. The user should replace them with brand-aligned icons, but the manifest metadata is the critical fix we can make now.

### 2. Layout Spacing Fix — Support Hub vs Pending Questions (`src/pages/EmployeeHome.tsx`)

The current layout uses `space-y-8` on the parent container, which should provide consistent gaps. Looking at the screenshot, the overlap likely comes from the Collapsible's `overflow-hidden` clipping hover shadows. Fix:

- Ensure `space-y-8` is maintained (already present)
- Remove `overflow-hidden` from the Support Hub Collapsible (it clips the shadow/lift effects and can cause visual crowding)
- Validate all cards have consistent `rounded-2xl` treatment

### 3. Pending Questions Enhancement (`src/pages/EmployeeHome.tsx`)

Currently the Pending Surveys card shows only count + generic text. Upgrade to show survey name and due date using the already-available `surveyMeta` data from `useScheduledQuestions`:

- The hook already returns `surveyMeta` (with `schedule_name`, `end_date`) — just not used on the home page
- Add `surveyMeta` to the destructured return
- Display `surveyMeta.schedule_name` as the survey title
- Display `surveyMeta.end_date` as "Due: {formatted date}" with a `Clock` icon
- If due date is within 2 days, show a subtle urgency indicator (amber text)
- Keep the card clickable linking to `/employee/survey`

### Files Modified

| File | Change |
|------|--------|
| `vite.config.ts` | Update manifest name/short_name/description to "Tammal" |
| `src/pages/EmployeeHome.tsx` | Remove overflow-hidden from Support Hub; enhance Pending Questions card with survey name + due date from surveyMeta |

