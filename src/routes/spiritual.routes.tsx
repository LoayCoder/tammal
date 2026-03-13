import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const PrayerTracker = lazy(() => import("@/features/spiritual/pages/PrayerTracker"));
const QuranReader = lazy(() => import("@/features/spiritual/pages/QuranReader"));
const QuranTextReader = lazy(() => import("@/features/spiritual/pages/QuranTextReader"));
const SunnahTracker = lazy(() => import("@/features/spiritual/pages/SunnahTracker"));
const SpiritualInsights = lazy(() => import("@/features/spiritual/pages/SpiritualInsights"));
const IslamicCalendar = lazy(() => import("@/features/spiritual/pages/IslamicCalendar"));

export const SpiritualRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="spiritual"><Outlet /></PageErrorBoundary>}>
    <Route path="/spiritual/prayer" element={<PrayerTracker />} />
    <Route path="/spiritual/quran" element={<QuranReader />} />
    <Route path="/spiritual/quran/read" element={<QuranTextReader />} />
    <Route path="/spiritual/sunnah" element={<SunnahTracker />} />
    <Route path="/spiritual/insights" element={<SpiritualInsights />} />
    <Route path="/spiritual/calendar" element={<IslamicCalendar />} />
  </Route>
);


