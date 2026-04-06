import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

const CACHE_RESET_KEY = "__lovable_cache_reset_v2__";

const resetStaleCaches = async () => {
  if (sessionStorage.getItem(CACHE_RESET_KEY)) return;

  sessionStorage.setItem(PREVIEW_CACHE_RESET_KEY, "1");

  const registrations = "serviceWorker" in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const cacheKeys = "caches" in window ? await caches.keys() : [];
  const hasStaleRuntimeState = registrations.length > 0 || cacheKeys.length > 0;

  await Promise.all(registrations.map((registration) => registration.unregister()));
  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));

  if (hasStaleRuntimeState) {
    window.location.reload();
    return;
  }
};

void resetPreviewCaches();

// Initialize Sentry before rendering (no-op in dev)
initSentry();

// Auto-reload on stale chunk hash (Vite dynamic import failure)
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
