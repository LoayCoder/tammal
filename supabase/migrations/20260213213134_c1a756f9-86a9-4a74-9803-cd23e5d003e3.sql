
-- Drop the overly restrictive policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can view active models" ON public.ai_models;

-- Create a public read policy for active models (global reference data)
CREATE POLICY "Anyone can view active models"
ON public.ai_models
FOR SELECT
USING (is_active = true);
