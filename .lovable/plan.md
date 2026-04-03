

## Plan: Upgrade Header Action Icons to VIP Style

The header toolbar icons (notification bell, language globe, theme toggle) currently use plain `variant="ghost"` buttons with default sizing. We'll give them a refined, premium VIP look consistent with the app's design language.

### Changes

**1. Header container (`src/components/layout/Header.tsx`, line 101)**
- Add a subtle VIP-styled wrapper with refined spacing: `gap-0.5 md:gap-1` and rounded icon buttons that feel polished.

**2. Notification Bell (`src/components/notifications/UnifiedNotificationBell.tsx`, line 207)**
- Change button from `variant="ghost" size="icon"` to include VIP styling: `h-9 w-9 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors` for a soft pill-button look.

**3. Language Selector (`src/components/LanguageSelector.tsx`, line 28)**
- Same VIP button styling: `h-9 w-9 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors`.
- Reduce icon size from `h-5 w-5` to `h-4 w-4` for consistency.

**4. Theme Toggle (`src/components/ThemeToggle.tsx`, lines 11-14)**
- Same VIP button styling: `h-9 w-9 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors`.
- Reduce icon size from `h-5 w-5` to `h-4 w-4`.

### Visual Result
All header action buttons will have a uniform soft-filled rounded container with subtle hover states, creating a cohesive premium toolbar feel — matching the VIP aesthetic used elsewhere in the app.

