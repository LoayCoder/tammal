

## Phase 7 — Mobile App Integration

### Assessment

The Team Pulse feature is **already integrated** into the employee dashboard (`EmployeeHome.tsx`) and renders on all viewports. The current state:

| Aspect | Status |
|--------|--------|
| Dashboard placement | Done — `TeamPulseCard` at position #4 in EmployeeHome |
| Role-aware modes | Done — `usePulseModes` resolves personal/team/org based on roles |
| Admin view | Done — Admins see personal tab via Dashboard.tsx `canSwitch` + org mode in PulseModeSwitcher |
| Manager view | Done — Managers/those with direct reports get team mode |
| Responsive layout | Partial — components use full-width but no mobile-specific optimizations |

### Gaps to Address

| Gap | Description |
|-----|-------------|
| **No mobile-aware layout adjustments** | All pulse sub-blocks (gauge, target, action, nudge) render identically on 384px and 1920px — no density optimization |
| **Touch targets too small** | Category chips in `QuickAppreciationCard` (py-1.5), mode switcher tabs (py-2), and CTA buttons could be larger on mobile |
| **No swipe/gesture support on mode switcher** | Mode tabs are tap-only; on mobile a swipeable pill pattern feels more natural |
| **Gauge SVG not size-adaptive** | Fixed 64px gauge; could be slightly larger on mobile where it's the hero element |
| **Appreciation form not mobile-optimized** | Native `<select>` is fine but textarea lacks mobile keyboard handling (`enterKeyHint`) |
| **No haptic-like feedback** | No `active:scale` press states on interactive elements |
| **Admin/Manager don't see pulse on their admin dashboard tabs** | `DashboardOverviewTab` and `OrgDashboard` don't include pulse — only available via personal tab |

### Plan

#### 1. Mobile touch target and density optimization

**Files**: `PulseModeSwitcher.tsx`, `PulseActionPath.tsx`, `PulseNudgeCard.tsx`, `QuickAppreciationCard.tsx`

- Increase tap targets to minimum 44px on mobile: mode switcher tabs `min-h-[44px]`, CTA buttons `py-3 sm:py-2.5`
- Add `active:scale-[0.98]` press feedback to all interactive buttons
- Add `enterKeyHint="send"` to appreciation textarea
- Increase category chip padding on mobile: `py-2 sm:py-1.5`

#### 2. Responsive gauge sizing

**File**: `PulseInsightBlock.tsx`

- Use `useIsMobile()` to render gauge at 72px on mobile (vs 64px desktop) — the gauge is the hero visual and deserves prominence on small screens
- Adjust score text size accordingly: `text-xl` on mobile, `text-lg` on desktop

#### 3. Admin/Manager dashboard pulse integration

**File**: `DashboardOverviewTab.tsx`

- Add a compact `TeamPulseCard` to the admin overview tab so managers/admins see org-level pulse without switching to personal tab
- Conditionally render only when employee data is available

#### 4. Smooth transitions and motion

**Files**: `TeamPulseCard.tsx`, `PulseModeSwitcher.tsx`

- Add `scroll-smooth` to the card container so mode switches feel fluid
- Add `transition-all duration-300` to mode content area for smooth content swap
- Ensure staggered `animate-fade-in` delays on child blocks (already partially done)

#### 5. Mobile-first appreciation form

**File**: `QuickAppreciationCard.tsx`

- Add `autoComplete="off"` and `enterKeyHint="send"` to textarea
- Ensure colleague `<select>` has adequate height for touch (`h-11`)
- Add send button `active:scale-[0.97]` for tactile press response

#### 6. Localization keys for mobile-specific copy (if needed)

No new keys required — existing labels are concise enough for mobile.

### Files Summary

| File | Change |
|------|--------|
| `src/features/team-pulse/components/PulseInsightBlock.tsx` | Responsive gauge size |
| `src/features/team-pulse/components/PulseModeSwitcher.tsx` | Touch targets, press states |
| `src/features/team-pulse/components/PulseActionPath.tsx` | Touch targets, press states |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | Touch targets, press states |
| `src/features/team-pulse/components/QuickAppreciationCard.tsx` | Mobile form UX, touch targets |
| `src/features/team-pulse/components/TeamPulseCard.tsx` | Smooth transitions, stagger |
| `src/components/dashboard/DashboardOverviewTab.tsx` | Add TeamPulseCard for admin view |

### What Is Not Changing

- No database or edge function changes
- No new routes or pages
- No new dependencies
- Widget priority order in EmployeeHome stays the same

