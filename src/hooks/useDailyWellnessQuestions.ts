import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface WellnessQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
}

export function useDailyWellnessQuestions(tenantId: string | null) {
  const { i18n } = useTranslation();
  const [question, setQuestion] = useState<WellnessQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `daily-questions:${lang}:${today}`;

  const fetchQuestion = useCallback(async (retry = false) => {
    if (!tenantId) { setIsLoading(false); return; }

    // 1. Check cache
    if (!retry) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setQuestion(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      } catch { /* ignore parse errors */ }
    }

    setIsLoading(true);
    setError(null);

    // 2. Fetch from DB
    const { data: schedule, error: scheduleErr } = await supabase
      .from('daily_question_schedule' as any)
      .select('question_id, wellness_questions(id, question_text_en, question_text_ar, question_type, options)')
      .eq('tenant_id', tenantId)
      .eq('scheduled_date', today)
      .limit(1)
      .maybeSingle();

    // 3. PGRST116 or no data -> auto-schedule
    if (!schedule || scheduleErr?.code === 'PGRST116') {
      if (!retry) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('auto-schedule-questions', {
            body: { tenantId, date: today },
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          });
          return fetchQuestion(true);
        } catch (e) {
          setError('Failed to auto-schedule question');
          setIsLoading(false);
          return;
        }
      }
      setError('No questions available for today');
      setIsLoading(false);
      return;
    }

    if (scheduleErr) {
      setError(scheduleErr.message);
      setIsLoading(false);
      return;
    }

    // 4. Map to localized question
    const wq = (schedule as any).wellness_questions;
    if (wq) {
      const q: WellnessQuestion = {
        question_id: wq.id,
        question_text: lang === 'ar' && wq.question_text_ar ? wq.question_text_ar : wq.question_text_en,
        question_type: wq.question_type,
        options: (wq.options as string[]) || [],
      };
      setQuestion(q);
      localStorage.setItem(cacheKey, JSON.stringify(q));
    }
    setIsLoading(false);
  }, [tenantId, today, cacheKey, lang]);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);

  return { question, isLoading, error, refetch: () => fetchQuestion(true) };
}
