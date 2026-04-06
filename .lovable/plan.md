

# Landing Page Updates — Email + Real Screenshots

## Changes

### 1. Update all CTA email links to `info@dhuud.com`
- `LandingCTA.tsx` — change both `mailto:hello@tammal.app` and `mailto:demo@tammal.app` to `mailto:info@dhuud.com`
- `LandingHero.tsx` — the hero CTA links to `#contact` (anchor scroll, no email change needed there)

### 2. Replace mockup components with real app screenshots
Currently the landing page uses hand-coded JSX mockups (fake charts, bars, cards) inside `BrowserFrame`. These need to be replaced with actual screenshots of the live app.

**Process:**
1. Navigate to key app pages in the browser and capture real screenshots
2. Save screenshots to `/public/screenshots/` (hero dashboard, analytics, workload, copilot, executive overview, team pulse)
3. Replace JSX mockup components with `<img>` tags referencing the screenshots inside the existing `BrowserFrame` wrappers

**Files affected:**
| File | Mockup to replace | Screenshot source |
|------|-------------------|-------------------|
| `LandingHero.tsx` | `DashboardMockup` → real dashboard screenshot | `/dashboard` page |
| `LandingShowcase.tsx` | `AnalyticsMockup` → analytics screenshot | Analytics/survey page |
| `LandingShowcase.tsx` | `WorkflowMockup` → workload screenshot | Workload/tasks page |
| `LandingShowcase.tsx` | `CopilotMockup` → copilot screenshot | Wellness copilot page |
| `LandingVisual.tsx` | `ExecutiveMockup` → executive dashboard screenshot | Executive overview page |
| `LandingVisual.tsx` | `TeamPulseMockup` → team pulse screenshot | Team pulse page |

**Implementation approach:**
- Each `BrowserFrame` will contain an `<img>` with `className="w-full h-auto"` instead of a JSX mockup div
- Images will be lazy-loaded (`loading="lazy"`) for performance
- The `BrowserFrame` wrapper, shadows, and animations remain unchanged
- Remove all unused mockup component code to keep files clean

### Summary
- 2 email references → `info@dhuud.com`
- 6 JSX mockups → 6 real app screenshots
- No structural or animation changes — only content swap

