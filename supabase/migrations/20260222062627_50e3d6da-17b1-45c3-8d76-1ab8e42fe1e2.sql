
-- Add unique constraint for fasting upsert
ALTER TABLE public.spiritual_fasting_logs 
ADD CONSTRAINT spiritual_fasting_logs_user_date_unique 
UNIQUE (user_id, fast_date);
