

## Fix: DesignSystemPage "Failed to fetch dynamically imported module"

### Problem
The error `Failed to fetch dynamically imported module: .../DesignSystemPage-DZWI8JRj.js` is a **stale chunk hash** issue. After the v1.5.0 edits, Vite rebuilt the page with a new filename hash, but the browser's cached route manifest still references the old hash. The file itself has no syntax or runtime errors (confirmed via esbuild parse).

### Solution
This is a transient caching issue. Two fixes:

1. **Immediate**: Hard-refresh the preview (Ctrl+Shift+R / Cmd+Shift+R) to clear the stale manifest
2. **Permanent**: Add a Vite error handler in `index.html` or `main.tsx` that auto-reloads when a dynamic import fails due to stale chunks — this prevents this class of error permanently

### Implementation

**File: `src/main.tsx`** — Add a window error listener that catches `Failed to fetch dynamically imported module` errors and triggers a single reload:

```ts
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});
```

This is Vite's built-in event for exactly this scenario. One line, no side effects.

### Files Modified
1. `src/main.tsx` — add `vite:preloadError` auto-reload handler (1 line)

