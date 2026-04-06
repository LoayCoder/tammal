

# Add App Access from Landing Page

## What Changes
Add a clear navigation path from the landing page to the app by linking to `/auth` (the login/signup page).

### 1. Navigation Bar (`LandingPage.tsx`)
- Add a "Sign In" or "Enter Platform" link/button in the nav bar pointing to `/auth`
- Keep the existing "Get Access" CTA (mailto) alongside it

### 2. Hero Section (`LandingHero.tsx`)
- Change "Request Private Access" button to link to `mailto:info@dhuud.com` (contact flow)
- Add a secondary "Enter Platform" or "Sign In" button linking to `/auth`
- Or: keep current layout and just add a nav-level sign-in link

### 3. CTA Section (`LandingCTA.tsx`)
- Add a "Sign In" link alongside the email CTA so existing users can jump into the app

### Approach
- Use React Router `<Link>` or `<a href="/auth">` for internal navigation
- No structural or animation changes — just adding navigation entry points

### Files Modified
| File | Change |
|------|--------|
| `LandingPage.tsx` | Add "Sign In" link to nav |
| `LandingHero.tsx` | Add "Enter Platform" button linking to `/auth` |
| `LandingCTA.tsx` | Add sign-in link option |

