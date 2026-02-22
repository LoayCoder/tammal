
-- Spiritual Wellbeing Module: 4 tables with strict user-only RLS

-- 1. Spiritual Preferences
CREATE TABLE public.spiritual_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  prayer_enabled BOOLEAN NOT NULL DEFAULT false,
  quran_enabled BOOLEAN NOT NULL DEFAULT false,
  fasting_enabled BOOLEAN NOT NULL DEFAULT false,
  reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_intensity TEXT NOT NULL DEFAULT 'light',
  city TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  calculation_method INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own spiritual preferences"
  ON public.spiritual_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_spiritual_preferences_updated_at
  BEFORE UPDATE ON public.spiritual_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Prayer Logs
CREATE TABLE public.spiritual_prayer_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL,
  prayer_date DATE NOT NULL,
  status TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, prayer_name, prayer_date)
);

ALTER TABLE public.spiritual_prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer logs"
  ON public.spiritual_prayer_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Quran Sessions (Phase 2 placeholder)
CREATE TABLE public.spiritual_quran_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  surah_name TEXT,
  juz_number INTEGER,
  reflection_notes TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_quran_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quran sessions"
  ON public.spiritual_quran_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Fasting Logs (Phase 2 placeholder)
CREATE TABLE public.spiritual_fasting_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fast_date DATE NOT NULL,
  fast_type TEXT NOT NULL DEFAULT 'sunnah',
  completed BOOLEAN NOT NULL DEFAULT false,
  energy_rating INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_fasting_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fasting logs"
  ON public.spiritual_fasting_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
