
-- Fix ISSUE-03: Add INSERT RLS policy for mood_question_history
-- The edge function uses service role (bypasses RLS) for inserts,
-- but this policy completes the security model for future client-side paths.
CREATE POLICY "Users can insert their own mood question history"
ON public.mood_question_history
FOR INSERT
WITH CHECK (user_id = auth.uid());
