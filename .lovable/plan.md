

# Premium Scrollbar, Mobile Top Bar, and Tab Upgrade

Three focused improvements: minimal scrollbar, native-feeling mobile header, and premium pill-style tabs.

---

## 1. Minimal Scrollbar (`src/index.css`)

Add global scrollbar styles using WebKit and Firefox scrollbar APIs:

- **Thin track**: 4px width, transparent background
- **Thumb**: `hsl(var(--border))` with 40% opacity, rounded
- **Hover**: opacity increases to 60%
- **Firefox**: `scrollbar-width: thin; scrollbar-color: hsl(var(--border) / 0.4) transparent`
- Dark mode: same approach with adjusted opacity

---

## 2. Mobile Top Bar — Native App Feel (`src/components/layout/Header.tsx`)

Replace the `SidebarTrigger` on mobile with the tenant's app icon/logo:

- Hide `SidebarTrigger` on mobile (`hidden md:flex`)
- Add a mobile-only block that renders `ThemeIcon` (with branding props from context or a lightweight branding hook) — falls back to a small app name text
- Header needs branding data: either pass it via props from `MainLayout` or use `useBranding` + `useTenantId` directly in Header
- Keep page title on mobile, keep right-side icons unchanged
- Result: `[Logo/Icon] [Page Title] ... [Notifications] [Avatar]`

**MainLayout change**: Pass `branding` prop to `<Header />`.

---

## 3. Premium Pill Tabs (`src/pages/Dashboard.tsx`)

Transform the flat border-bottom tabs into a soft segmented control:

- **TabsList**: `bg-muted/6 rounded-full p-1 gap-1` — soft tinted pill container
- **TabsTrigger**: `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200`
- **Active state**: `data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm` — elevated pill with subtle shadow
- **Inactive**: `text-muted-foreground hover:text-foreground/80`
- Remove all border-b-2 styling

Also update the inner tabs in `OrgDashboard.tsx` and `PortfolioDashboard.tsx` to use consistent pill style.

---

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add minimal scrollbar CSS |
| `src/components/layout/Header.tsx` | Mobile: logo instead of sidebar trigger |
| `src/components/layout/MainLayout.tsx` | Pass branding to Header |
| `src/pages/Dashboard.tsx` | Pill-style tabs |
| `src/components/dashboard/OrgDashboard.tsx` | Consistent pill tabs |
| `src/pages/admin/PortfolioDashboard.tsx` | Consistent pill tabs |

